"use client";

import { useState, useMemo, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { adminFetch } from "@/lib/adminApi";
import InvoiceModal from "./InvoiceModal";

import { 
  Package, 
  User, 
  MapPin, 
  Clock, 
  CreditCard,
  Plus,
  X,
  Truck,
  Search,
  DollarSign,
  FileText,
  Shield,
  Globe,
  AlertTriangle
} from "lucide-react";

// ============================================
// UTILITY FUNCTIONS (Place outside component)
// ============================================

function generateCarrierRef() {
  return "LOG" + Math.floor(100000000000 + Math.random() * 900000000000);
}

function generateClientId() {
  return uuidv4();
}

function generateVehicleId() {
  return "VEH-" + Math.floor(1000 + Math.random() * 9000);
}

function generateDriverId() {
  return "DRV-" + Math.floor(1000 + Math.random() * 9000);
}

function getTaxRate(destCity, destCountry) {
  const defaultTaxRate = 0.10;

  const USStateRates = {
    'New York': 0.08875,
    'California': 0.0725,
    'Texas': 0.0625,
    'Florida': 0.06,
    'Illinois': 0.0625,
  };

  const countryRates = {
    'United States': 0.07, 
    'United Kingdom': 0.20,
    'Germany': 0.19,
    'France': 0.20,
    'Canada': 0.05,
    'Australia': 0.10,
    'Turkey': 0.18,
  };

  if (destCountry === 'United States' && destCity in USStateRates) {
    return USStateRates[destCity];
  }

  if (destCountry in countryRates) {
    return countryRates[destCountry];
  }

  return defaultTaxRate;
}

function calculateBaseShipping(weight, shipmentMode) {
  const rates = {
    'Air Shipping': 10,
    'Sea Shipping': 3,
    'Land Shipping': 5
  };
  return weight * (rates[shipmentMode] || 5);
}

function calculateTotalCost(form, productsArray) {
  const declaredValue = parseFloat(form.declared_value) || 0;
  
  const totalWeight = productsArray.reduce((sum, p) => {
    return sum + (parseFloat(p.weight_kg) || 0) * (parseInt(p.qty) || 1);
  }, 0);
  
  const destCountry = form.destCity ? form.destCity.split(', ').pop() : '';
  const destCityName = form.destCity ? form.destCity.split(', ')[0] : '';
  
  const taxAmount = declaredValue * getTaxRate(destCityName, destCountry);
  const baseShipping = calculateBaseShipping(totalWeight, form.shipment_mode);
  const insuranceFee = form.insurance ? declaredValue * 0.01 : 0;
  const handlingFee = (form.special_handling?.length || 0) * 50;
  const totalCost = baseShipping + insuranceFee + handlingFee + taxAmount;
  
  return {
    taxAmount: taxAmount.toFixed(2),
    totalCost: totalCost.toFixed(2)
  };
}

const EMPTY_FORM = {
  name: "",
  agency: "",
  originCity: "",
  destCity: "",
  origin_lat: null,
  origin_lng: null,
  dest_lat: null,
  dest_lng: null,
  estimated_hours: "",
  shipper_name: "",
  shipper_phone: "",
  shipper_address: "",
  receiver_name: "",
  receiver_phone: "",
  receiver_email: "",
  receiver_address: "",
  shipment_type: "Truckload",
  shipment_mode: "Land Shipping",
  payment_mode: "PAYPAL",
  status: "In Transit",
  location: "",
  total_cost: "",
  currency: "USD",
  payment_status: "Pending",
  tax_amount: "",
  insurance: false,
  insurance_value: "",
  declared_value: "",
  pickup_datetime: "",
  expected_delivery_datetime: "",
  delivery_datetime: "",
  delivery_signature_required: false,
  shipment_category: "General",
  special_handling: [],
  hs_code: "",
  country_of_manufacture: "",
  customs_declaration_description: "",
  incoterm: "EXW",
  admin_comment: "",
  reason_for_status_change: ""
};

const EMPTY_PRODUCT = { piece_type: "", product: "", description: "", qty: 1, length_cm: 0, width_cm: 0, height_cm: 0, weight_kg: 0 };

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminForm({ onSuccess }) {
  const [cities, setCities] = useState([]);
  const [citiesLoaded, setCitiesLoaded] = useState(false);
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdInvoice, setCreatedInvoice] = useState(null); // { shipment, products } snapshot for the invoice modal

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    carrier_ref: generateCarrierRef(),
    client_id: generateClientId(),
    current_vehicle_id: generateVehicleId(),
    current_driver_id: generateDriverId(),
  });

  const [products, setProducts] = useState([{ ...EMPTY_PRODUCT }]);

  const [specialHandlingOptions] = useState([
    "Fragile", "Perishable", "Hazardous", "Temperature Controlled", "High Value"
  ]);

  const isInternational = useMemo(() => {
    if (!form.originCity || !form.destCity) return false;
    const originCountry = form.originCity.split(', ').pop();
    const destCountry = form.destCity.split(', ').pop();
    return originCountry !== destCountry;
  }, [form.originCity, form.destCity]);

  const calculatedWeights = useMemo(() => {
    const totalWeight = products.reduce((sum, p) => sum + (parseFloat(p.weight_kg) || 0) * (parseInt(p.qty) || 1), 0);
    const volumetricWeight = products.reduce((sum, p) => {
      const vol = (parseFloat(p.length_cm) || 0) * (parseFloat(p.width_cm) || 0) * (parseFloat(p.height_cm) || 0);
      return sum + (vol / 5000) * (parseInt(p.qty) || 1);
    }, 0);
    return { totalWeight: totalWeight.toFixed(2), volumetricWeight: volumetricWeight.toFixed(2) };
  }, [products]);

  useEffect(() => {
    if (!citiesLoaded) {
      fetch('/cities.json')
        .then(res => res.json())
        .then(data => {
          setCities(data);
          setCitiesLoaded(true);
        })
        .catch(err => {
          console.error('Failed to load cities:', err);
        });
    }
  }, [citiesLoaded]);

  const filteredOriginCities = useMemo(() => {
    if (!originSearch || originSearch.length < 2) return [];
    const searchLower = originSearch.toLowerCase();
    return cities
      .filter(city => 
        city.name.toLowerCase().includes(searchLower) ||
        city.country.toLowerCase().includes(searchLower)
      )
      .slice(0, 50);
  }, [cities, originSearch]);

  const filteredDestCities = useMemo(() => {
    if (!destSearch || destSearch.length < 2) return [];
    const searchLower = destSearch.toLowerCase();
    return cities
      .filter(city => 
        city.name.toLowerCase().includes(searchLower) ||
        city.country.toLowerCase().includes(searchLower)
      )
      .slice(0, 50);
  }, [cities, destSearch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const updatedForm = {
      ...form,
      [name]: type === 'checkbox' ? checked : value
    };
    
    if (['declared_value', 'insurance', 'destCity', 'shipment_mode'].includes(name)) {
      const { taxAmount, totalCost } = calculateTotalCost(updatedForm, products);
      setForm({ ...updatedForm, tax_amount: taxAmount, total_cost: totalCost });
    } else {
      setForm(updatedForm);
    }
  };

  const handleSpecialHandlingToggle = (option) => {
    const current = form.special_handling || [];
    const updated = current.includes(option)
      ? current.filter(h => h !== option)
      : [...current, option];
    
    const updatedForm = { ...form, special_handling: updated };
    const { taxAmount, totalCost } = calculateTotalCost(updatedForm, products);
    setForm({ ...updatedForm, tax_amount: taxAmount, total_cost: totalCost });
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
    
    if (field === 'weight_kg' || field === 'qty') {
      const { taxAmount, totalCost } = calculateTotalCost(form, updated);
      setForm({ ...form, tax_amount: taxAmount, total_cost: totalCost });
    }
  };

  const addProduct = () => {
    setProducts([...products, { ...EMPTY_PRODUCT }]);
  };

  const removeProduct = (index) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
    const { taxAmount, totalCost } = calculateTotalCost(form, updated);
    setForm({ ...form, tax_amount: taxAmount, total_cost: totalCost });
  };

  const selectOriginCity = (city) => {
    setForm({ 
      ...form, 
      originCity: `${city.name}, ${city.country}`,
      origin_lat: parseFloat(city.lat),
      origin_lng: parseFloat(city.lng)
    });
    setOriginSearch(`${city.name}, ${city.country}`);
    setShowOriginDropdown(false);
  };

  const selectDestCity = (city) => {
    const updatedForm = { 
      ...form, 
      destCity: `${city.name}, ${city.country}`,
      dest_lat: parseFloat(city.lat),
      dest_lng: parseFloat(city.lng)
    };
    const { taxAmount, totalCost } = calculateTotalCost(updatedForm, products);
    setForm({ ...updatedForm, tax_amount: taxAmount, total_cost: totalCost });
    setDestSearch(`${city.name}, ${city.country}`);
    setShowDestDropdown(false);
  };

  const handleSubmit = async () => {
    setSubmitError("");

    // Client-side validation
    if (!form.name.trim()) {
      setSubmitError("Shipment Name is required.");
      return;
    }
    if (!form.agency.trim()) {
      setSubmitError("Agency is required.");
      return;
    }
    if (!form.originCity) {
      setSubmitError("Please select an Origin City.");
      return;
    }
    if (!form.destCity) {
      setSubmitError("Please select a Destination City.");
      return;
    }
    if (!form.estimated_hours) {
      setSubmitError("Estimated Hours is required.");
      return;
    }
    if (isInternational && (!form.hs_code || !form.incoterm)) {
      setSubmitError("International shipments require HS Code and Incoterm.");
      return;
    }
    if (form.insurance && !form.insurance_value) {
      setSubmitError("Insurance value is required when insurance is enabled.");
      return;
    }
    if (parseFloat(form.declared_value) > 5 && !form.insurance) {
      setSubmitError("Insurance is required for shipments with declared value over $5.");
      return;
    }

    setSubmitting(true);

    // Safety net — never stay stuck longer than 35 seconds
    const safetyTimer = setTimeout(() => {
      setSubmitting(false);
      setSubmitError("Request timed out after 35 seconds. Please try again.");
    }, 35000);

    try {
      const payload = {
        ...form,
        products,
        current_lat: form.origin_lat,
        current_lng: form.origin_lng,
        total_weight: calculatedWeights.totalWeight,
        volumetric_weight: calculatedWeights.volumetricWeight,
        tracking_history: [{
          event: "Shipment Created",
          location: form.location || form.originCity,
          timestamp: new Date().toISOString(),
          reason: form.reason_for_status_change || "Initial shipment creation",
          status: form.status || "In Transit",
        }]
      };

      const res = await adminFetch("/api/shipments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || `Server error (${res.status})`);
      }

      // Snapshot the just-created shipment (form + products) so we can show its invoice,
      // since the API only returns { code, message, summary } and not the full record.
      setCreatedInvoice({
        shipment: { ...form, code: data.code },
        products,
      });

      // Reset form on success
      setForm({
        ...EMPTY_FORM,
        carrier_ref: generateCarrierRef(),
        client_id: generateClientId(),
        current_vehicle_id: generateVehicleId(),
        current_driver_id: generateDriverId(),
      });
      setOriginSearch("");
      setDestSearch("");
      setProducts([{ ...EMPTY_PRODUCT }]);
      setSubmitError("");

      // onSuccess (switches tab, refreshes list, shows toast) fires once the admin
      // closes the invoice modal, so they see the invoice before leaving this screen.
    } catch (err) {
      console.error("Create shipment error:", err);
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      clearTimeout(safetyTimer);
      setSubmitting(false);
    }
  };

  const statusColors = {
    "On Hold": "bg-yellow-100 text-yellow-700 border-yellow-300",
    "In Transit": "bg-blue-100 text-blue-700 border-blue-300",
    "Delivered": "bg-green-100 text-green-700 border-green-300",
    "Cancelled": "bg-red-100 text-red-700 border-red-300",
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

  return (
    <div className="space-y-8 p-6">
      
      {/* Client Context Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Client Context</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Client ID</label>
            <input 
              className={`${inputClass} bg-gray-100`}
              name="client_id"
              value={form.client_id}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Finance & Pricing Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Finance & Pricing</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Total Cost</label>
            <input 
              type="number"
              step="0.01"
              className={inputClass} 
              name="total_cost" 
              placeholder="0.00" 
              value={form.total_cost} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label className={labelClass}>Currency</label>
            <select className={inputClass} name="currency" value={form.currency} onChange={handleChange}>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>JPY</option>
              <option>CAD</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Payment Status</label>
            <select className={inputClass} name="payment_status" value={form.payment_status} onChange={handleChange}>
              <option>Pending</option>
              <option>Paid</option>
              <option>COD</option>
              <option>Failed</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Tax Amount</label>
            <input 
              type="number"
              step="0.01"
              className={`${inputClass} bg-gray-100`}
              name="tax_amount" 
              placeholder="Auto-calculated" 
              value={form.tax_amount} 
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Declared Value</label>
            <input 
              type="number"
              step="0.01"
              className={inputClass} 
              name="declared_value" 
              placeholder="0.00" 
              value={form.declared_value} 
              onChange={handleChange} 
            />
            {parseFloat(form.declared_value) > 5 && !form.insurance && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Insurance required for value &gt; $5
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                name="insurance"
                checked={form.insurance}
                onChange={handleChange}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <Shield className="w-5 h-5 text-emerald-600" />
              <span className={labelClass.replace('block', 'inline')}>Enable Insurance Coverage</span>
            </label>
            {form.insurance && (
              <input 
                type="number"
                step="0.01"
                className={`${inputClass} mt-2`}
                name="insurance_value" 
                placeholder="Insurance coverage amount" 
                value={form.insurance_value} 
                onChange={handleChange} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Shipment Details Section */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-500 p-2 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Shipment Details</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Shipment Name *</label>
            <input 
              className={inputClass} 
              name="name" 
              placeholder="e.g., Electronics Batch #123" 
              value={form.name} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label className={labelClass}>Agency *</label>
            <input 
              className={inputClass} 
              name="agency" 
              placeholder="e.g., FedEx, DHL, UPS" 
              value={form.agency} 
              onChange={handleChange} 
            />
          </div>

          {/* Origin City with Search */}
          <div className="relative">
            <label className={labelClass}>
              <MapPin className="w-4 h-4 inline mr-1" />
              Origin City *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                className={`${inputClass} pl-10`}
                type="text"
                placeholder="Type to search 130,000+ cities..."
                value={originSearch}
                onChange={(e) => {
                  setOriginSearch(e.target.value);
                  setShowOriginDropdown(true);
                }}
                onFocus={() => setShowOriginDropdown(true)}
              />
            </div>
            {showOriginDropdown && originSearch.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {filteredOriginCities.length > 0 ? (
                  filteredOriginCities.map((city, idx) => (
                    <button
                      key={`${city.name}-${city.country}-${idx}`}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 transition duration-150 border-b border-gray-100 last:border-b-0"
                      onClick={() => selectOriginCity(city)}
                    >
                      <div className="font-medium text-gray-900">{city.name}</div>
                      <div className="text-sm text-gray-500">{city.country}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">No cities found.</div>
                )}
              </div>
            )}
          </div>

          {/* Destination City with Search */}
          <div className="relative">
            <label className={labelClass}>
              <MapPin className="w-4 h-4 inline mr-1" />
              Destination City *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                className={`${inputClass} pl-10`}
                type="text"
                placeholder="Type to search 130,000+ cities..."
                value={destSearch}
                onChange={(e) => {
                  setDestSearch(e.target.value);
                  setShowDestDropdown(true);
                }}
                onFocus={() => setShowDestDropdown(true)}
              />
            </div>
            {showDestDropdown && destSearch.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {filteredDestCities.length > 0 ? (
                  filteredDestCities.map((city, idx) => (
                    <button
                      key={`${city.name}-${city.country}-${idx}`}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 transition duration-150 border-b border-gray-100 last:border-b-0"
                      onClick={() => selectDestCity(city)}
                    >
                      <div className="font-medium text-gray-900">{city.name}</div>
                      <div className="text-sm text-gray-500">{city.country}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">No cities found.</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>
              <Clock className="w-4 h-4 inline mr-1" />
              Estimated Hours *
            </label>
            <input 
              type="number" 
              className={inputClass} 
              name="estimated_hours" 
              placeholder="e.g., 48" 
              value={form.estimated_hours} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label className={labelClass}>Shipment Category</label>
            <select className={inputClass} name="shipment_category" value={form.shipment_category} onChange={handleChange}>
              <option>General</option>
              <option>Express</option>
              <option>Fragile</option>
              <option>Perishable</option>
              <option>Hazardous</option>
              <option>High Value</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Shipment Type *</label>
            <select className={inputClass} name="shipment_type" value={form.shipment_type} onChange={handleChange}>
              <option>Truckload</option>
              <option>Less than Truckload (LTL)</option>
              <option>Air Freight</option>
              <option>Ocean Freight</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              <Truck className="w-4 h-4 inline mr-1" />
              Shipment Mode *
            </label>
            <select className={inputClass} name="shipment_mode" value={form.shipment_mode} onChange={handleChange}>
              <option>Land Shipping</option>
              <option>Air Shipping</option>
              <option>Sea Shipping</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              <CreditCard className="w-4 h-4 inline mr-1" />
              Payment Mode *
            </label>
            <select className={inputClass} name="payment_mode" value={form.payment_mode} onChange={handleChange}>
              <option>PAYPAL</option>
              <option>CREDIT CARD</option>
              <option>CASH APP</option>
              <option>ZELLE</option>
              <option>VENMO</option>
              <option>APPLE PAY</option>
              <option>BITCOIN</option>
              <option>BANK TRANSFER</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Carrier Reference No.</label>
            <input 
              className={`${inputClass} bg-gray-100`} 
              name="carrier_ref" 
              value={form.carrier_ref} 
              readOnly 
            />
          </div>

          <div>
            <label className={labelClass}>Vehicle ID</label>
            <input 
              className={`${inputClass} bg-gray-100`}
              name="current_vehicle_id"
              value={form.current_vehicle_id}
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>Driver ID</label>
            <input 
              className={`${inputClass} bg-gray-100`}
              name="current_driver_id"
              value={form.current_driver_id}
              readOnly
            />
          </div>

          <div>
            <label className={labelClass}>
              <Clock className="w-4 h-4 inline mr-1" />
              Pickup Date & Time
            </label>
            <div className="relative">
              <input 
                type="datetime-local"
                id="pickup_datetime_input"
                className={inputClass}
                style={{ paddingRight: '3rem' }}
                name="pickup_datetime" 
                value={form.pickup_datetime} 
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => document.getElementById('pickup_datetime_input').showPicker()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-100 p-1.5 rounded-lg hover:bg-purple-200 transition cursor-pointer flex items-center justify-center"
              >
                <Clock className="w-4 h-4 text-purple-600" />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <Clock className="w-4 h-4 inline mr-1" />
              Expected Delivery Date & Time
            </label>
            <div className="relative">
              <input 
                type="datetime-local"
                id="expected_delivery_datetime_input"
                className={inputClass}
                style={{ paddingRight: '3rem' }}
                name="expected_delivery_datetime" 
                value={form.expected_delivery_datetime} 
                onChange={(e) =>
                  setForm({
                    ...form,
                    expected_delivery_datetime: e.target.value,
                    delivery_datetime: e.target.value,
                  })
                }
              />
              <button
                type="button"
                onClick={() => document.getElementById('expected_delivery_datetime_input').showPicker()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-100 p-1.5 rounded-lg hover:bg-purple-200 transition cursor-pointer flex items-center justify-center"
              >
                <Clock className="w-4 h-4 text-purple-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              name="delivery_signature_required"
              checked={form.delivery_signature_required}
              onChange={handleChange}
              className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
            <label className="text-sm font-semibold text-gray-700">
              Signature Required on Delivery
            </label>
          </div>

          <div>
            <label className={labelClass}>Initial Status *</label>
            <div className="flex gap-3 items-center">
              <select 
                className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500`} 
                name="status" 
                value={form.status} 
                onChange={handleChange} 
              >
                <option value="On Hold">On Hold</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
              </select>
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${statusColors[form.status]}`}>
                {form.status}
              </span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Reason for Status</label>
            <input 
              className={inputClass} 
              name="reason_for_status_change" 
              placeholder="e.g., Initial creation, weather delay..." 
              value={form.reason_for_status_change} 
              onChange={handleChange} 
            />
          </div>
        </div>

        {/* Special Handling */}
        <div className="mt-4">
          <label className={labelClass}>Special Handling</label>
          <div className="flex flex-wrap gap-2">
            {specialHandlingOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleSpecialHandlingToggle(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  (form.special_handling || []).includes(option)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customs & International (Conditional) */}
      {isInternational && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Customs & International Shipping</h3>
            <span className="ml-auto bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">REQUIRED</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>HS Code *</label>
              <input 
                className={inputClass} 
                name="hs_code" 
                placeholder="e.g., 8471.30.01" 
                value={form.hs_code} 
                onChange={handleChange} 
              />
            </div>

            <div>
              <label className={labelClass}>Incoterm *</label>
              <select className={inputClass} name="incoterm" value={form.incoterm} onChange={handleChange}>
                <option>DAP</option>
                <option>DDP</option>
                <option>EXW</option>
                <option>FOB</option>
                <option>CIF</option>
                <option>CPT</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Country of Manufacture</label>
              <input 
                className={inputClass} 
                name="country_of_manufacture" 
                placeholder="e.g., China, USA, Germany" 
                value={form.country_of_manufacture} 
                onChange={handleChange} 
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Customs Declaration Description</label>
              <textarea 
                className={inputClass} 
                name="customs_declaration_description" 
                placeholder="Detailed description of goods for customs" 
                value={form.customs_declaration_description} 
                onChange={handleChange} 
                rows="2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Calculated Weights Display */}
      <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 p-6 rounded-xl border border-cyan-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-cyan-500 p-2 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Weight Calculations (Auto-Computed)</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border-2 border-cyan-200">
            <p className="text-xs text-gray-600 mb-1">Total Weight</p>
            <p className="text-2xl font-bold text-cyan-600">{calculatedWeights.totalWeight} kg</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-cyan-200">
            <p className="text-xs text-gray-600 mb-1">Volumetric Weight</p>
            <p className="text-2xl font-bold text-cyan-600">{calculatedWeights.volumetricWeight} kg</p>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-cyan-200">
            <p className="text-xs text-gray-600 mb-1">Chargeable Weight</p>
            <p className="text-2xl font-bold text-purple-600">
              {Math.max(parseFloat(calculatedWeights.totalWeight), parseFloat(calculatedWeights.volumetricWeight)).toFixed(2)} kg
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border-2 border-cyan-200">
            <p className="text-xs text-gray-600 mb-1">Total Pieces</p>
            <p className="text-2xl font-bold text-gray-900">
              {products.reduce((sum, p) => sum + (parseInt(p.qty) || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Shipper Information */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500 p-2 rounded-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Shipper Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Shipper Name *</label>
            <input 
              className={inputClass} 
              name="shipper_name" 
              placeholder="Full name" 
              value={form.shipper_name} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label className={labelClass}>Shipper Phone *</label>
            <input 
              className={inputClass} 
              name="shipper_phone" 
              placeholder="+1 234 567 8900" 
              value={form.shipper_phone} 
              onChange={handleChange} 
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Shipper Address *</label>
            <textarea 
              className={inputClass} 
              name="shipper_address" 
              placeholder="Full address with city, state, zip" 
              value={form.shipper_address} 
              onChange={handleChange} 
              rows="2"
            />
          </div>
        </div>
      </div>

      {/* Receiver Information */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-500 p-2 rounded-lg">
            <User className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Receiver Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Receiver Name *</label>
            <input 
              className={inputClass} 
              name="receiver_name" 
              placeholder="Full name" 
              value={form.receiver_name} 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label className={labelClass}>Receiver Phone *</label>
            <input 
              className={inputClass} 
              name="receiver_phone" 
              placeholder="+1 234 567 8900" 
              value={form.receiver_phone} 
              onChange={handleChange} 
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Receiver Email *</label>
            <input 
              type="email" 
              className={inputClass} 
              name="receiver_email" 
              placeholder="email@example.com" 
              value={form.receiver_email} 
              onChange={handleChange} 
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Receiver Address *</label>
            <textarea 
              className={inputClass} 
              name="receiver_address" 
              placeholder="Full address with city, state, zip" 
              value={form.receiver_address} 
              onChange={handleChange} 
              rows="2"
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Products</h3>
          </div>
          <button 
            type="button" 
            onClick={addProduct} 
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        <div className="space-y-4">
          {products.map((p, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border-2 border-green-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-700">Product #{idx + 1}</span>
                {products.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeProduct(idx)} 
                    className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Piece Type *</label>
                  <input 
                    className={inputClass} 
                    placeholder="Box, Pallet, etc." 
                    value={p.piece_type} 
                    onChange={(e) => handleProductChange(idx, "piece_type", e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                  <input 
                    className={inputClass} 
                    placeholder="Product details" 
                    value={p.description} 
                    onChange={(e) => handleProductChange(idx, "description", e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Product *</label>
                  <input 
                    className={inputClass} 
                    placeholder="Product name" 
                    value={p.product} 
                    onChange={(e) => handleProductChange(idx, "product", e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    placeholder="Qty" 
                    value={p.qty} 
                    onChange={(e) => handleProductChange(idx, "qty", e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Weight (kg) *</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    placeholder="kg" 
                    value={p.weight_kg} 
                    onChange={(e) => handleProductChange(idx, "weight_kg", e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Length (cm) *</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    placeholder="cm" 
                    value={p.length_cm} 
                    onChange={(e) => handleProductChange(idx, "length_cm", e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Width (cm) *</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    placeholder="cm" 
                    value={p.width_cm} 
                    onChange={(e) => handleProductChange(idx, "width_cm", e.target.value)} 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Height (cm) *</label>
                  <input 
                    type="number" 
                    className={inputClass} 
                    placeholder="cm" 
                    value={p.height_cm} 
                    onChange={(e) => handleProductChange(idx, "height_cm", e.target.value)} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Notes */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-700" />
          Admin Notes (Optional)
        </h3>
        <textarea 
          className={inputClass} 
          name="admin_comment" 
          placeholder="Internal notes, special instructions, etc..." 
          value={form.admin_comment} 
          onChange={handleChange} 
          rows="3"
        />
        <p className="text-sm text-gray-500 mt-2">These notes are for internal use and will be visible to customers.</p>
      </div>

      {/* Error message */}
      {submitError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Failed to create shipment</p>
            <p className="text-red-700 text-sm mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button 
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-gradient-to-r from-purple-600 to-orange-500 text-white px-8 py-4 rounded-xl hover:shadow-2xl transition duration-300 transform hover:scale-105 font-bold text-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
        >
          <Package className="w-5 h-5" />
          {submitting ? "Creating Shipment..." : "Create Shipment"}
        </button>
      </div>

      {/* Invoice modal — shown right after a successful shipment creation */}
      {createdInvoice && (
        <InvoiceModal
          shipment={createdInvoice.shipment}
          products={createdInvoice.products}
          onClose={() => {
            setCreatedInvoice(null);
            onSuccess?.();
          }}
        />
      )}

      {/* Loading Indicator */}
      {!citiesLoaded && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Loading 130,000+ cities...
        </div>
      )}
    </div>
  );
}
