"use client";

import { forwardRef } from "react";

// Formats a number as currency using the shipment's currency code, falling back gracefully.
function formatMoney(value, currency) {
  const num = parseFloat(value);
  if (isNaN(num)) return "-";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(num);
  } catch {
    // Unknown/invalid currency code — fall back to plain number with the code prefixed
    return `${currency || ""} ${num.toFixed(2)}`;
  }
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// Older shipments (created before origin/destination city names were persisted) only have
// coordinates saved. Fall back to showing those rather than a bare "-".
function resolveLocationLabel(cityName, lat, lng) {
  if (cityName) return cityName;
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (!isNaN(latNum) && !isNaN(lngNum)) return `${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`;
  return "Not recorded";
}

/**
 * Normalizes the two shapes this component may receive:
 * 1. The live `form` + `products` state from AdminForm right after creating a shipment.
 * 2. A shipment row as stored/returned by the API/Supabase.
 * Both use mostly the same field names, so this just fills in safe fallbacks.
 */
export function buildInvoiceData(shipment, products) {
  const items = Array.isArray(products) ? products : (Array.isArray(shipment?.products) ? shipment.products : []);

  const totalWeight = items.reduce(
    (sum, p) => sum + (parseFloat(p.weight_kg) || 0) * (parseInt(p.qty) || 1),
    0
  );

  return {
    code: shipment?.code || "",
    name: shipment?.name || "",
    agency: shipment?.agency || "",
    carrier_ref: shipment?.carrier_ref || "",
    status: shipment?.status || "In Transit",
    payment_status: shipment?.payment_status || "Pending",
    payment_mode: shipment?.payment_mode || "-",
    currency: shipment?.currency || "USD",
    originCity: resolveLocationLabel(shipment?.originCity || shipment?.location, shipment?.origin_lat, shipment?.origin_lng),
    destCity: resolveLocationLabel(shipment?.destCity, shipment?.dest_lat, shipment?.dest_lng),
    shipper_name: shipment?.shipper_name || "-",
    shipper_phone: shipment?.shipper_phone || "-",
    shipper_address: shipment?.shipper_address || "-",
    receiver_name: shipment?.receiver_name || "-",
    receiver_phone: shipment?.receiver_phone || "-",
    receiver_email: shipment?.receiver_email || "-",
    receiver_address: shipment?.receiver_address || "-",
    products: items,
    total_weight: shipment?.total_weight ?? totalWeight.toFixed(2),
    declared_value: shipment?.declared_value ?? 0,
    tax_amount: shipment?.tax_amount ?? 0,
    insurance: !!shipment?.insurance,
    insurance_value: shipment?.insurance_value ?? 0,
    total_cost: shipment?.total_cost ?? 0,
    created_at: shipment?.created_at || new Date().toISOString(),
    shipment_mode: shipment?.shipment_mode || "-",
    shipment_type: shipment?.shipment_type || "-",
  };
}

const ShipmentInvoice = forwardRef(function ShipmentInvoice({ data }, ref) {
  const inv = data;
  const subtotal =
    (parseFloat(inv.total_cost) || 0) -
    (parseFloat(inv.tax_amount) || 0) -
    (inv.insurance ? (parseFloat(inv.declared_value) || 0) * 0.01 : 0);

  return (
    <div
      ref={ref}
      className="bg-white text-gray-900 w-full max-w-[800px] mx-auto p-8"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-purple-600 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <svg width="44" height="44" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="108" height="108" rx="30" fill="#0F172A"/>
            <path d="M35 69L58 46H80L57 69H35Z" fill="#E2E8F0"/>
            <path d="M35 72H57L77 92H55L35 72Z" fill="#CBD5E1"/>
            <path d="M56 69L80 46V67L56 92V69Z" fill="#FF6A13"/>
            <path d="M54 43H86V52H69L90 73L83 80L62 59V74H54V43Z" fill="#FF6A13"/>
          </svg>
          <div>
            <p className="text-2xl font-extrabold text-gray-900">ShipTrack Global</p>
            <p className="text-xs text-gray-500">Worldwide Shipping &amp; Logistics</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-purple-700">INVOICE</p>
          <p className="text-sm text-gray-600 mt-1">Shipment: <strong>{inv.code}</strong></p>
          <p className="text-sm text-gray-600">Date: {formatDate(inv.created_at)}</p>
        </div>
      </div>

      {/* Status strip */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
          Status: {inv.status}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
          Payment: {inv.payment_status}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          Carrier Ref: {inv.carrier_ref}
        </span>
      </div>

      {/* Shipment summary */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Shipment</p>
          <p className="font-semibold text-gray-900">{inv.name || "-"}</p>
          <p className="text-gray-600">Agency: {inv.agency || "-"}</p>
          <p className="text-gray-600">{inv.shipment_mode} &middot; {inv.shipment_type}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Route</p>
          <p className="text-gray-800">From: <strong>{inv.originCity}</strong></p>
          <p className="text-gray-800">To: <strong>{inv.destCity}</strong></p>
        </div>
      </div>

      {/* Shipper / Receiver */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Shipper</p>
          <p className="font-semibold text-gray-900">{inv.shipper_name}</p>
          <p className="text-gray-600">{inv.shipper_address}</p>
          <p className="text-gray-600">{inv.shipper_phone}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">Receiver</p>
          <p className="font-semibold text-gray-900">{inv.receiver_name}</p>
          <p className="text-gray-600">{inv.receiver_address}</p>
          <p className="text-gray-600">{inv.receiver_phone}</p>
          <p className="text-gray-600">{inv.receiver_email}</p>
        </div>
      </div>

      {/* Products table */}
      <table className="w-full text-sm mb-6 border-collapse">
        <thead>
          <tr className="bg-gray-900 text-white text-left">
            <th className="p-2 rounded-l-lg">Item</th>
            <th className="p-2">Description</th>
            <th className="p-2 text-center">Qty</th>
            <th className="p-2 text-right rounded-r-lg">Weight (kg)</th>
          </tr>
        </thead>
        <tbody>
          {inv.products.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-3 text-center text-gray-400">No items listed</td>
            </tr>
          ) : (
            inv.products.map((p, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="p-2">{p.piece_type || "-"}{p.product ? ` — ${p.product}` : ""}</td>
                <td className="p-2 text-gray-600">{p.description || "-"}</td>
                <td className="p-2 text-center">{p.qty || 1}</td>
                <td className="p-2 text-right">{p.weight_kg || 0}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64 text-sm">
          <div className="flex justify-between py-1 text-gray-600">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal, inv.currency)}</span>
          </div>
          <div className="flex justify-between py-1 text-gray-600">
            <span>Tax</span>
            <span>{formatMoney(inv.tax_amount, inv.currency)}</span>
          </div>
          {inv.insurance && (
            <div className="flex justify-between py-1 text-gray-600">
              <span>Insurance ({formatMoney(inv.insurance_value, inv.currency)} covered)</span>
              <span>{formatMoney((parseFloat(inv.declared_value) || 0) * 0.01, inv.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-gray-900 mt-1 font-bold text-gray-900 text-base">
            <span>Total</span>
            <span>{formatMoney(inv.total_cost, inv.currency)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">Payment method: {inv.payment_mode}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
        <p>Thank you for shipping with ShipTrack Global.</p>
        <p>Track this shipment anytime using code <strong>{inv.code}</strong>.</p>
      </div>
    </div>
  );
});

export default ShipmentInvoice;
