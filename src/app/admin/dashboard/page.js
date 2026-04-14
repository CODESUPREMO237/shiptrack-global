"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AdminForm from "@/components/AdminForm";
import AdminSecurityPanel from "@/components/AdminSecurityPanel";
import ChatWidget from "@/components/ChatWidget";
import { adminFetch } from "@/lib/adminApi";
import { supabase } from "@/lib/supabaseClient";
import { 
  Package, 
  LogOut, 
  MessageSquare, 
  Plus, 
  Edit3, 
  Truck,
  MapPin,
  ChevronDown,
  ChevronUp,
  Mail,
  ShieldCheck
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksVisible, setFeedbacksVisible] = useState(false);
  const [expandedShipments, setExpandedShipments] = useState({});
  const [activeTab, setActiveTab] = useState("shipments"); // shipments, create, feedbacks, security

  const shipmentTypes = ["Truckload", "Less than Truckload"];
  const shipmentModes = ["Land Shipping", "Air Shipping", "Sea Shipping"];
  const paymentModes = ["CASH", "Credit Card", "Bank Transfer"];
  const statusOptions = ["On Hold", "In Transit", "Delivered", "Cancelled"];

  useEffect(() => {
    loadShipments();
    loadFeedbacks();
  }, []);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const res = await adminFetch("/api/shipments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load shipments");
      const safeData = data.map((s) => ({
        ...s,
        products: Array.isArray(s.products) ? s.products : [],
      }));
      setShipments(safeData);
    } catch (err) {
      console.error("Error loading shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbacks = async () => {
    try {
      const res = await adminFetch("/api/feedbacks");
      const data = await res.json();
      if (data.success) setFeedbacks(data.data || []);
      else setFeedbacks([]);
    } catch (err) {
      console.error(err);
      setFeedbacks([]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin");
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const updateShipmentField = async (code, field, value) => {
    try {
      const payload = { [field]: value };
      const endpoint = field === "admin_comment" ? `/api/tracking/${code}` : `/api/shipments/${code}`;

      const res = await adminFetch(endpoint, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Update failed");

      if (field === "admin_comment") {
        showToast(`Admin comment for ${code} updated and email sent!`);
      } else {
        showToast(`Shipment ${code} updated successfully!`);
      }

      loadShipments();
    } catch (err) {
      console.error("Failed to update shipment:", err);
      showToast("Failed to update shipment");
    }
  };

  const handleProductChange = async (shipmentCode, index, field, value) => {
    const shipment = shipments.find((s) => s.code === shipmentCode);
    if (!shipment) return;
    const updatedProducts = [...shipment.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    await updateShipmentField(shipmentCode, "products", updatedProducts);
  };

  const addProduct = async (shipmentCode) => {
    const shipment = shipments.find((s) => s.code === shipmentCode);
    if (!shipment) return;
    const updatedProducts = [
      ...shipment.products,
      { piece_type: "", description: "", qty: 1, length_cm: 0, width_cm: 0, height_cm: 0, weight_kg: 0 },
    ];
    await updateShipmentField(shipmentCode, "products", updatedProducts);
  };

  const removeProduct = async (shipmentCode, index) => {
    const shipment = shipments.find((s) => s.code === shipmentCode);
    if (!shipment) return;
    const updatedProducts = shipment.products.filter((_, i) => i !== index);
    await updateShipmentField(shipmentCode, "products", updatedProducts);
  };

  const toggleShipmentExpanded = (code) => {
    setExpandedShipments(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const getStatusColor = (status) => {
    const colors = {
      "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "In Transit": "bg-blue-100 text-blue-800 border-blue-200",
      "Delivered": "bg-green-100 text-green-800 border-green-200",
      "Cancelled": "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Toast */}
        {toast && (
          <div className="fixed top-5 right-5 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-slide-in">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              {toast}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-orange-500 text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold">Admin Dashboard</h1>
                  <p className="text-purple-100 text-sm">Manage shipments and track operations</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg transition duration-200"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-6 border-b border-white/20">
              <button
                onClick={() => setActiveTab("shipments")}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition duration-200 ${
                  activeTab === "shipments"
                    ? "bg-white text-purple-600 font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Truck className="w-4 h-4" />
                Shipments ({shipments.length})
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition duration-200 ${
                  activeTab === "create"
                    ? "bg-white text-purple-600 font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Plus className="w-4 h-4" />
                Create New
              </button>
              <button
                onClick={() => setActiveTab("feedbacks")}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition duration-200 ${
                  activeTab === "feedbacks"
                    ? "bg-white text-purple-600 font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Feedbacks ({feedbacks.length})
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition duration-200 ${
                  activeTab === "security"
                    ? "bg-white text-purple-600 font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Account Security
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          
          {/* Create Shipment Tab */}
          {activeTab === "create" && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Plus className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Shipment</h2>
              </div>
              <AdminForm onSuccess={() => {
                loadShipments();
                setActiveTab("shipments");
                showToast("Shipment created successfully!");
              }} />
            </div>
          )}

          {/* Feedbacks Tab */}
          {activeTab === "feedbacks" && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Customer Feedbacks</h2>
              </div>
              {feedbacks.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No feedbacks yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((f) => (
                    <div key={f.id} className="border border-gray-200 p-6 rounded-xl hover:shadow-lg transition duration-200 bg-gradient-to-r from-white to-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{f.name}</p>
                          <p className="text-purple-600 text-sm">{f.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(f.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{f.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && <AdminSecurityPanel />}

          {/* Shipments Tab */}
          {activeTab === "shipments" && (
            <div className="space-y-4 animate-fade-in">
              {loading ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
                  <p className="text-gray-600 mt-4">Loading shipments...</p>
                </div>
              ) : shipments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No shipments yet</p>
                  <button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Create First Shipment
                  </button>
                </div>
              ) : (
                shipments.map((shipment) => (
                  <div
                    key={shipment.code}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition duration-300"
                  >
                    {/* Shipment Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-orange-50 p-6 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{shipment.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(shipment.status)}`}>
                              {shipment.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              Code: <strong>{shipment.code}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Truck className="w-4 h-4" />
                              {shipment.agency}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleShipmentExpanded(shipment.code)}
                          className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg hover:bg-gray-50 transition text-purple-600 font-medium"
                        >
                          <Edit3 className="w-4 h-4" />
                          {expandedShipments[shipment.code] ? "Hide Details" : "Edit Details"}
                          {expandedShipments[shipment.code] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedShipments[shipment.code] && (
                      <div className="p-6 space-y-6">
                        {/* Quick Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-purple-50 p-4 rounded-xl">
                            <p className="text-xs text-purple-600 font-semibold mb-1">Shipment Type</p>
                            <select
                              className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-900 font-medium focus:ring-2 focus:ring-purple-500"
                              value={shipment.shipment_type || "Truckload"}
                              onChange={(e) => updateShipmentField(shipment.code, "shipment_type", e.target.value)}
                            >
                              {shipmentTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>

                          <div className="bg-orange-50 p-4 rounded-xl">
                            <p className="text-xs text-orange-600 font-semibold mb-1">Shipment Mode</p>
                            <select
                              className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-900 font-medium focus:ring-2 focus:ring-orange-500"
                              value={shipment.shipment_mode || "Land Shipping"}
                              onChange={(e) => updateShipmentField(shipment.code, "shipment_mode", e.target.value)}
                            >
                              {shipmentModes.map((mode) => (
                                <option key={mode} value={mode}>{mode}</option>
                              ))}
                            </select>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-xl">
                            <p className="text-xs text-blue-600 font-semibold mb-1">Payment Mode</p>
                            <select
                              className="w-full bg-white border-0 rounded-lg px-3 py-2 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500"
                              value={shipment.payment_mode || "CASH"}
                              onChange={(e) => updateShipmentField(shipment.code, "payment_mode", e.target.value)}
                            >
                              {paymentModes.map((mode) => (
                                <option key={mode} value={mode}>{mode}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Status and Carrier */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                            <select
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              value={shipment.status || "On Hold"}
                              onChange={(e) => updateShipmentField(shipment.code, "status", e.target.value)}
                            >
                              {statusOptions.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Carrier Reference</label>
                            <input
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              value={shipment.carrier_ref || ""}
                              onChange={(e) => updateShipmentField(shipment.code, "carrier_ref", e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Admin Comment */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Comment (Sent to Customer)</label>
                          <textarea
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Enter admin note..."
                            rows="3"
                            value={commentInputs[shipment.code] ?? shipment.admin_comment ?? ""}
                            onChange={(e) =>
                              setCommentInputs({
                                ...commentInputs,
                                [shipment.code]: e.target.value,
                              })
                            }
                          />
                          <button
                            className="mt-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition duration-200"
                            onClick={() => {
                              const comment = commentInputs[shipment.code]?.trim();
                              if (!comment) return;
                              updateShipmentField(shipment.code, "admin_comment", comment);
                            }}
                          >
                            Save & Send Email
                          </button>
                        </div>

                        {/* Products Section */}
                        <div className="border-t pt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-gray-900">Products</h4>
                            <button
                              onClick={() => addProduct(shipment.code)}
                              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                            >
                              <Plus className="w-4 h-4" />
                              Add Product
                            </button>
                          </div>
                          <div className="space-y-3">
                            {(shipment.products || []).map((p, idx) => (
                              <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                  <input
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    placeholder="Piece Type"
                                    value={p.piece_type || ""}
                                    onChange={(e) =>
                                      handleProductChange(shipment.code, idx, "piece_type", e.target.value)
                                    }
                                  />
                                  <input
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    placeholder="Description"
                                    value={p.description || ""}
                                    onChange={(e) =>
                                      handleProductChange(shipment.code, idx, "description", e.target.value)
                                    }
                                  />
                                  <input
                                    type="number"
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    placeholder="Qty"
                                    value={p.qty || 1}
                                    onChange={(e) =>
                                      handleProductChange(shipment.code, idx, "qty", e.target.value)
                                    }
                                  />
                                  <input
                                    type="number"
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                    placeholder="Weight (kg)"
                                    value={p.weight_kg || 0}
                                    onChange={(e) =>
                                      handleProductChange(shipment.code, idx, "weight_kg", e.target.value)
                                    }
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <div className="text-xs text-gray-500">
                                    Dimensions: {p.length_cm || 0} × {p.width_cm || 0} × {p.height_cm || 0} cm
                                  </div>
                                  <button
                                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                                    onClick={() => removeProduct(shipment.code, idx)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Location Update */}
                        <div className="border-t pt-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-purple-600" />
                            Update Current Location
                          </h4>
                          <div className="flex gap-3">
                            <input
                              type="number"
                              step="0.000001"
                              id={`lat-${shipment.code}`}
                              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-white"
                              placeholder="Latitude"
                            />
                            <input
                              type="number"
                              step="0.000001"
                              id={`lng-${shipment.code}`}
                              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-white"
                              placeholder="Longitude"
                            />
                            <button
                              onClick={() => {
                                const lat = parseFloat(document.getElementById(`lat-${shipment.code}`).value);
                                const lng = parseFloat(document.getElementById(`lng-${shipment.code}`).value);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                  updateShipmentField(shipment.code, "current_lat", lat);
                                  updateShipmentField(shipment.code, "current_lng", lng);
                                } else {
                                  alert("Enter valid coordinates");
                                }
                              }}
                              className="bg-gradient-to-r from-purple-600 to-orange-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Chat Widget */}
        <ChatWidget isAdmin={true} />
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </AuthGuard>
  );
}
