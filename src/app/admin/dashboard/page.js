"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AdminForm from "@/components/AdminForm";
import AdminSecurityPanel from "@/components/AdminSecurityPanel";
import ChatWidget from "@/components/ChatWidget";
import { adminFetch, clearAdminToken } from "@/lib/adminApi";
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
  ShieldCheck,
  Bell,
  BellOff
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [editInputs, setEditInputs] = useState({});
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksVisible, setFeedbacksVisible] = useState(false);
  const [expandedShipments, setExpandedShipments] = useState({});
  const [activeTab, setActiveTab] = useState("shipments");
  const [loadError, setLoadError] = useState(null);
  const [pushStatus, setPushStatus] = useState("idle"); // idle | subscribing | subscribed | unsupported
  const [pushSubscription, setPushSubscription] = useState(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const shipmentTypes = ["Truckload", "Less than Truckload"];
  const shipmentModes = ["Land Shipping", "Air Shipping", "Sea Shipping"];
  const paymentModes = ["CASH", "Credit Card", "Bank Transfer"];
  const statusOptions = ["On Hold", "In Transit", "Delivered", "Cancelled"];

  useEffect(() => {
    loadShipments();
    loadFeedbacks();

    // Safety net: if loading is still true after 20s, force it off with an error
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          setLoadError("Loading timed out. Please check your connection and retry.");
          return false;
        }
        return prev;
      });
    }, 20000);
    return () => clearTimeout(timeout);
  }, []);

  // Check push subscription status on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect iOS Safari (doesn't support Web Push outside of PWA/home screen)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true; // true = installed as PWA
    if (isIOS && !isStandalone) {
      setPushStatus("ios-browser");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setPushSubscription(sub);
          setPushStatus("subscribed");
        } else {
          setPushStatus("idle");
        }
      });
    });
  }, []);

  const enablePushNotifications = async () => {
    try {
      setPushStatus("subscribing");

      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Ask for permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast("Notification permission denied");
        setPushStatus("idle");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        showToast("VAPID key not configured — set NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        setPushStatus("idle");
        return;
      }

      // Convert VAPID public key to Uint8Array
      const urlBase64ToUint8Array = (base64String) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = atob(base64);
        return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
      };

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Save subscription to server
      const res = await adminFetch("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      setPushSubscription(sub);
      setPushStatus("subscribed");
      showToast("✅ Push notifications enabled! You'll be notified on this device when visitors arrive.");
    } catch (err) {
      console.error("Push subscribe error:", err);
      showToast("Failed to enable notifications: " + err.message);
      setPushStatus("idle");
    }
  };

  const disablePushNotifications = async () => {
    try {
      if (pushSubscription) {
        await adminFetch("/api/push/subscribe", {
          method: "DELETE",
          body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
        });
        await pushSubscription.unsubscribe();
      }
      setPushSubscription(null);
      setPushStatus("idle");
      showToast("Push notifications disabled.");
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      showToast("Failed to disable notifications");
    }
  };

  const loadShipments = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await adminFetch("/api/shipments");
      // If session is fully expired and couldn't be refreshed, send to login
      if (res.status === 401) {
        clearAdminToken();
        router.replace("/admin");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load shipments");
      const safeData = data.map((s) => ({
        ...s,
        products: Array.isArray(s.products) ? s.products : [],
      }));
      setShipments(safeData);
    } catch (err) {
      console.error("Error loading shipments:", err);
      setLoadError(err.message || "Failed to load shipments");
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
    clearAdminToken();
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

  // Set a local edit value without saving
  const setEditField = (code, field, value) => {
    setEditInputs(prev => ({
      ...prev,
      [code]: { ...(prev[code] || {}), [field]: value }
    }));
  };

  // Get current edit value (local draft > saved value)
  const getEditField = (code, field, fallback) => {
    const draft = editInputs[code]?.[field];
    return draft !== undefined ? draft : fallback;
  };

  // Save all pending edits for a shipment at once
  const saveEditFields = async (code) => {
    const drafts = editInputs[code];
    if (!drafts || Object.keys(drafts).length === 0) return;
    for (const [field, value] of Object.entries(drafts)) {
      await updateShipmentField(code, field, value);
    }
    setEditInputs(prev => { const n = {...prev}; delete n[code]; return n; });
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

        {/* iOS Add-to-Home-Screen Guide Modal */}
        {showIOSGuide && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-sm p-6 mb-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Enable Notifications on iPhone</h2>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >×</button>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                iPhone requires the site to be installed as an app before enabling push notifications. Follow these steps in <strong>Safari</strong>:
              </p>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <div>
                    <p className="font-semibold text-gray-800">Open in Safari</p>
                    <p className="text-xs text-gray-500">Make sure you are using Safari, not Chrome or another browser.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <div>
                    <p className="font-semibold text-gray-800">Tap the Share button</p>
                    <p className="text-xs text-gray-500">The <span className="font-bold">⬆ Share</span> icon is at the bottom center of Safari (box with an arrow pointing up).</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <div>
                    <p className="font-semibold text-gray-800">Tap "Add to Home Screen"</p>
                    <p className="text-xs text-gray-500">Scroll down in the share sheet and tap <span className="font-bold">Add to Home Screen</span>, then tap <span className="font-bold">Add</span>.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">4</span>
                  <div>
                    <p className="font-semibold text-gray-800">Open the app & tap "Enable Alerts"</p>
                    <p className="text-xs text-gray-500">Launch ShipTrack from your Home Screen icon, log in, then tap the <span className="font-bold">Enable Alerts</span> button.</p>
                  </div>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition duration-200"
              >
                Got it
              </button>
            </div>
          </div>
        )}


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
              <div className="flex items-center gap-3">
                {/* Push Notification Toggle */}
                {pushStatus === "ios-browser" ? (
                  <button
                    onClick={() => setShowIOSGuide(true)}
                    className="flex items-center gap-2 bg-yellow-400/30 hover:bg-yellow-400/50 border border-yellow-300/50 backdrop-blur-sm px-4 py-2 rounded-lg text-white text-sm transition duration-200"
                  >
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>Enable Alerts</span>
                  </button>
                ) : pushStatus !== "unsupported" && (
                  <button
                    onClick={pushStatus === "subscribed" ? disablePushNotifications : enablePushNotifications}
                    disabled={pushStatus === "subscribing"}
                    title={pushStatus === "subscribed" ? "Notifications ON — click to disable" : "Enable visitor notifications on this device"}
                    className={`flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-lg transition duration-200 ${
                      pushStatus === "subscribed"
                        ? "bg-green-400/30 hover:bg-green-400/50 text-white border border-green-300/50"
                        : pushStatus === "subscribing"
                        ? "bg-white/10 text-white/60 cursor-wait"
                        : "bg-white/20 hover:bg-white/30 text-white"
                    }`}
                  >
                    {pushStatus === "subscribed" ? (
                      <Bell className="w-4 h-4 fill-current" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                    <span className="hidden md:inline">
                      {pushStatus === "subscribed"
                        ? "Notifications ON"
                        : pushStatus === "subscribing"
                        ? "Enabling…"
                        : "Enable Alerts"}
                    </span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg transition duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
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
              ) : loadError ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                  <p className="text-red-600 font-semibold text-lg mb-2">⚠️ Error loading shipments</p>
                  <p className="text-gray-500 text-sm mb-4">{loadError}</p>
                  <button
                    onClick={() => { setLoadError(null); loadShipments(); }}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Retry
                  </button>
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
                            <div className="flex gap-2">
                              <input
                                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "carrier_ref", shipment.carrier_ref || "")}
                                onChange={(e) => setEditField(shipment.code, "carrier_ref", e.target.value)}
                              />
                              <button
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-semibold"
                                onClick={() => saveEditFields(shipment.code)}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Pricing & Finance */}
                        <div className="border-t pt-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">💰 Pricing & Finance</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Cost</label>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "total_cost", shipment.total_cost ?? "")}
                                onChange={(e) => setEditField(shipment.code, "total_cost", e.target.value ? parseFloat(e.target.value) : null)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                              <select
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "currency", shipment.currency || "USD")}
                                onChange={(e) => setEditField(shipment.code, "currency", e.target.value)}
                              >
                                {["USD","EUR","GBP","CAD","AUD","XAF","NGN","GHS","ZAR"].map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
                              <select
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "payment_status", shipment.payment_status || "Pending")}
                                onChange={(e) => setEditField(shipment.code, "payment_status", e.target.value)}
                              >
                                {["Pending","Paid","Partial","Refunded"].map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Declared Value</label>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "declared_value", shipment.declared_value ?? "")}
                                onChange={(e) => setEditField(shipment.code, "declared_value", e.target.value ? parseFloat(e.target.value) : null)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Amount</label>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "tax_amount", shipment.tax_amount ?? "")}
                                onChange={(e) => setEditField(shipment.code, "tax_amount", e.target.value ? parseFloat(e.target.value) : null)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Value</label>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "insurance_value", shipment.insurance_value ?? "")}
                                onChange={(e) => setEditField(shipment.code, "insurance_value", e.target.value ? parseFloat(e.target.value) : null)}
                              />
                            </div>
                          </div>
                          <button
                            className="mt-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition duration-200 font-semibold"
                            onClick={() => saveEditFields(shipment.code)}
                          >
                            Save Pricing
                          </button>
                        </div>

                        {/* Shipper & Receiver */}
                        <div className="border-t pt-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">📦 Shipper & Receiver</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <p className="text-sm font-bold text-purple-600 uppercase tracking-wide">Shipper</p>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  value={getEditField(shipment.code, "shipper_name", shipment.shipper_name || "")}
                                  onChange={(e) => setEditField(shipment.code, "shipper_name", e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  value={getEditField(shipment.code, "shipper_address", shipment.shipper_address || "")}
                                  onChange={(e) => setEditField(shipment.code, "shipper_address", e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  value={getEditField(shipment.code, "shipper_phone", shipment.shipper_phone || "")}
                                  onChange={(e) => setEditField(shipment.code, "shipper_phone", e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <p className="text-sm font-bold text-orange-600 uppercase tracking-wide">Receiver</p>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  value={getEditField(shipment.code, "receiver_name", shipment.receiver_name || "")}
                                  onChange={(e) => setEditField(shipment.code, "receiver_name", e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  value={getEditField(shipment.code, "receiver_address", shipment.receiver_address || "")}
                                  onChange={(e) => setEditField(shipment.code, "receiver_address", e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                                <input
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  value={getEditField(shipment.code, "receiver_phone", shipment.receiver_phone || "")}
                                  onChange={(e) => setEditField(shipment.code, "receiver_phone", e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                                <input
                                  type="email"
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  value={getEditField(shipment.code, "receiver_email", shipment.receiver_email || "")}
                                  onChange={(e) => setEditField(shipment.code, "receiver_email", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            className="mt-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition duration-200 font-semibold"
                            onClick={() => saveEditFields(shipment.code)}
                          >
                            Save Shipper & Receiver
                          </button>
                        </div>

                        {/* Origin & Destination */}
                        <div className="border-t pt-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">🗺️ Origin & Destination</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Origin City</label>
                              <input
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "originCity", shipment.originCity || shipment.location || "")}
                                onChange={(e) => setEditField(shipment.code, "originCity", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Destination City</label>
                              <input
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "destCity", shipment.destCity || "")}
                                onChange={(e) => setEditField(shipment.code, "destCity", e.target.value)}
                              />
                            </div>
                          </div>
                          <button
                            className="mt-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition duration-200 font-semibold"
                            onClick={() => saveEditFields(shipment.code)}
                          >
                            Save Locations
                          </button>
                        </div>

                        {/* Dates */}
                        <div className="border-t pt-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">📅 Dates</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Date & Time</label>
                              <input
                                type="datetime-local"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "pickup_datetime", shipment.pickup_datetime ? shipment.pickup_datetime.slice(0,16) : "")}
                                onChange={(e) => setEditField(shipment.code, "pickup_datetime", e.target.value ? new Date(e.target.value).toISOString() : null)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Delivery</label>
                              <input
                                type="datetime-local"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "expected_delivery_datetime", shipment.expected_delivery_datetime ? shipment.expected_delivery_datetime.slice(0,16) : "")}
                                onChange={(e) => setEditField(shipment.code, "expected_delivery_datetime", e.target.value ? new Date(e.target.value).toISOString() : null)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Actual Delivery</label>
                              <input
                                type="datetime-local"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={getEditField(shipment.code, "delivery_datetime", shipment.delivery_datetime ? shipment.delivery_datetime.slice(0,16) : "")}
                                onChange={(e) => setEditField(shipment.code, "delivery_datetime", e.target.value ? new Date(e.target.value).toISOString() : null)}
                              />
                            </div>
                          </div>
                          <button
                            className="mt-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition duration-200 font-semibold"
                            onClick={() => saveEditFields(shipment.code)}
                          >
                            Save Dates
                          </button>
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

    </AuthGuard>
  );
}
