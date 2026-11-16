 "use client";
import { useState } from "react";
import { cities } from "@/lib/cities";

export default function ShipmentDrawer({ shipment, onClose, onStatusChange, onUpdateLocation }) {
  if (!shipment) return null;

  const [lat, setLat] = useState(shipment.current_lat);
  const [lng, setLng] = useState(shipment.current_lng);

  const setCity = (cityName) => {
    const c = cities.find((c) => c.name === cityName);
    if (c) {
      setLat(c.lat);
      setLng(c.lng);
    }
  };

  const statuses = ["Created", "In Transit", "On Hold", "Delivered"];

  return (
    <div className="fixed top-0 right-0 w-full sm:w-[450px] h-screen bg-white shadow-2xl p-6 overflow-y-auto z-50">
      <button className="text-red-600 font-bold float-right" onClick={onClose}>✕</button>

      <h2 className="text-2xl font-bold">{shipment.name}</h2>
      <p className="text-sm text-gray-600">Code: {shipment.code}</p>

      {/* Status Section */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Status</h3>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(shipment.code, s)}
              className={`px-3 py-1 rounded-lg border ${
                shipment.status === s ? "bg-blue-600 text-white" : "bg-gray-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Location Update */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Update Location</h3>

        <select className="input" onChange={(e) => setCity(e.target.value)}>
          <option value="">Quick set city</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>{c.name}, {c.country}</option>
          ))}
        </select>

        <div className="flex gap-2 mt-3">
          <input type="number" className="input" placeholder="Lat" value={lat} onChange={(e) => setLat(e.target.value)} />
          <input type="number" className="input" placeholder="Lng" value={lng} onChange={(e) => setLng(e.target.value)} />
        </div>

        <button
          className="bg-blue-600 text-white mt-3 px-4 py-2 rounded-lg w-full"
          onClick={() => onUpdateLocation(shipment.code, lat, lng)}
        >
          Save Location
        </button>
      </div>

      {/* People Info */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Shipper</h3>
        <p><strong>{shipment.shipper_name}</strong></p>
        <p>{shipment.shipper_email}</p>
        <p className="text-sm text-gray-600">{shipment.shipper_address}</p>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Receiver</h3>
        <p><strong>{shipment.receiver_name}</strong></p>
        <p>{shipment.receiver_phone}</p>
        <p className="text-sm text-gray-600">{shipment.receiver_address}</p>
      </div>

      {/* Products */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Products</h3>
        {shipment.products?.length ? (
          shipment.products.map((p, i) => (
            <div key={i} className="border p-3 rounded mb-2 text-sm">
              <p><strong>Piece:</strong> {p.piece_type}</p>
              <p><strong>Description:</strong> {p.description}</p>
              <p><strong>Qty:</strong> {p.qty}</p>
              <p><strong>Weight:</strong> {p.weight_kg} kg</p>
            </div>
          ))
        ) : (
          <p>No products listed</p>
        )}
      </div>

    </div>
  );
}
