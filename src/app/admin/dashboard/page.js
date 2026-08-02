"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import AdminForm from "@/components/AdminForm";
import InvoiceModal from "@/components/InvoiceModal";
import AdminSecurityPanel from "@/components/AdminSecurityPanel";
import ChatWidget from "@/components/ChatWidget";
import { adminFetch, clearAdminToken } from "@/lib/adminApi";
import { supabase } from "@/lib/supabaseClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  BellOff,
  Receipt
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
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramSubscribers, setTelegramSubscribers] = useState([]);
  const [showTelegramSetup, setShowTelegramSetup] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramLabel, setTelegramLabel] = useState("");
  const [savingFields, setSavingFields] = useState({});
  const [dateInputs, setDateInputs] = useState({}); // { [code]: { pickup_datetime, expected_delivery_datetime, delivery_datetime } }
  const [invoiceShipment, setInvoiceShipment] = useState(null); // shipment currently shown in the InvoiceModal

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

  // Load Telegram subscribers on mount
  useEffect(() => {
    adminFetch("/api/telegram/setup")
      .then((r) => r.json())
      .then((d) => {
        setTelegramConnected(d.connected);
        setTelegramSubscribers(d.subscribers || []);
      })
      .catch(() => {});
  }, []);

  const connectTelegram = async () => {
    const id = telegramChatId.trim();
    if (!id) { showToast("Please enter your Chat ID"); return; }
    try {
      const res = await adminFetch("/api/telegram/setup", {
        method: "POST",
        body: JSON.stringify({ chat_id: id, label: telegramLabel.trim() || "Admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      // Refresh subscriber list
      const updated = await adminFetch("/api/telegram/setup").then((r) => r.json());
      setTelegramConnected(updated.connected);
      setTelegramSubscribers(updated.subscribers || []);
      setTelegramChatId("");
      setTelegramLabel("");
      showToast("✅ Telegram connected! Check your Telegram for a confirmation message.");
    } catch (err) {
      showToast("Failed: " + err.message);
    }
  };

  const disconnectTelegram = async (chatId) => {
    try {
      await adminFetch("/api/telegram/setup", {
        method: "DELETE",
        body: JSON.stringify({ chat_id: chatId }),
      });
      const updated = await adminFetch("/api/telegram/setup").then((r) => r.json());
      setTelegramConnected(updated.connected);
      setTelegramSubscribers(updated.subscribers || []);
      showToast("Telegram account removed.");
    } catch {
      showToast("Failed to remove Telegram account");
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
      const safeData = data.map((s) => {
        let parsedProducts = s.products;
        if (typeof parsedProducts === "string") {
          try {
            parsedProducts = JSON.parse(parsedProducts);
          } catch {
            parsedProducts = [];
          }
        }
        return {
          ...s,
          products: Array.isArray(parsedProducts) ? parsedProducts : [],
        };
      });
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

  // Normalize any datetime string into valid YYYY-MM-DDTHH:MM for datetime-local input
  const normalizeDatetime = (val) => {
    if (!val) return "";
    const s = String(val).trim();
    // Fast path: already looks like ISO with T separator
    if (s.includes("T")) {
      const sliced = s.slice(0, 16);
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(sliced)) return sliced;
    }
    // Date-only: append midnight
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + "T00:00";
    // Fallback: try parsing with Date constructor (handles space-separated, offsets, etc.)
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return "";
  };

  // Save all pending edits for a shipment at once (single batched PATCH)
  const saveEditFields = async (code) => {
    const drafts = editInputs[code];
    if (!drafts || Object.keys(drafts).length === 0) {
      showToast("No changes to save. Modify a field first.");
      return;
    }
    if (savingFields[code]) return; // already saving, prevent double-click

    setSavingFields(prev => ({ ...prev, [code]: true }));
    try {
      const res = await adminFetch(`/api/shipments/${code}`, {
        method: "PATCH",
        body: JSON.stringify(drafts),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Update failed");
      showToast(`Shipment ${code} updated successfully!`);
      setEditInputs(prev => { const n = {...prev}; delete n[code]; return n; });
      loadShipments();
    } catch (err) {
      console.error("Failed to update shipment:", err);
      showToast("Failed to update shipment");
    } finally {
      setSavingFields(prev => { const n = {...prev}; delete n[code]; return n; });
    }
  };

  // Dedicated handler for the Save Dates button — uses dateInputs state
  const saveDateFields = async (code, shipment) => {
    if (savingFields[code]) return;

    const dateFields = ["pickup_datetime", "expected_delivery_datetime", "delivery_datetime"];
    const payload = {};
    let hasChanges = false;
    const current = dateInputs[code] || {};

    dateFields.forEach((field) => {
      const stateVal = current[field]; // Date object | null | undefined
      const dbRaw = shipment[field]; // ISO string | null
      const dbDate = dbRaw ? new Date(dbRaw) : null;

      if (stateVal === undefined) return; // not touched

      if (stateVal === null && dbRaw) {
        // User cleared a date that existed
        payload[field] = null;
        hasChanges = true;
      } else if (stateVal && (!dbDate || stateVal.getTime() !== dbDate.getTime())) {
        // User set or changed a date
        payload[field] = stateVal.toISOString();
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      showToast("No date changes detected.");
      return;
    }

    setSavingFields(prev => ({ ...prev, [code]: true }));
    try {
      const res = await adminFetch(`/api/shipments/${code}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Update failed");
      showToast(`Dates for ${code} updated successfully!`);
      // Clear date state so it re-initializes from fresh DB data
      setDateInputs(prev => { const n = {...prev}; delete n[code]; return n; });
      loadShipments();
    } catch (err) {
      console.error("Failed to update dates:", err);
      showToast("Failed to update dates");
    } finally {
      setSavingFields(prev => { const n = {...prev}; delete n[code]; return n; });
    }
  };

  // Helper to get/initialize a date value for the picker
  const getDateInput = (code, field, shipment) => {
    if (dateInputs[code]?.[field] !== undefined) return dateInputs[code][field];
    const raw = shipment[field];
    return raw ? new Date(raw) : null;
  };

  const setDateInput = (code, field, value) => {
    setDateInputs(prev => ({
      ...prev,
      [code]: { ...(prev[code] || {}), [field]: value }
    }));
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

        {/* Telegram Setup Modal */}
        {showTelegramSetup && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setShowTelegramSetup(false); }}
            onTouchEnd={(e) => { if (e.target === e.currentTarget) setShowTelegramSetup(false); }}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-sm p-6 mb-4 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ touchAction: 'manipulation' }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">✈️ Telegram Notifications</h2>
                <button onClick={() => setShowTelegramSetup(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>

              {/* Connected accounts list */}
              {telegramSubscribers.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Connected Accounts ({telegramSubscribers.length})</p>
                  <div className="space-y-2">
                    {telegramSubscribers.map((sub) => (
                      <div key={sub.chat_id} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{sub.label}</p>
                          <p className="text-xs text-gray-400">ID: {sub.chat_id}</p>
                        </div>
                        <button
                          onClick={() => disconnectTelegram(sub.chat_id)}
                          className="text-red-400 hover:text-red-600 text-xs font-semibold ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm font-semibold text-gray-700 mb-1">Add another account</p>
                <p className="text-xs text-gray-400 mb-4">Each person follows these steps on their own phone:</p>
                <ol className="space-y-3 mb-5">
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Open Telegram → find the bot</p>
                      <a
                        href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline break-all"
                      >
                        t.me/{process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username'}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <p className="text-sm text-gray-700">Send <code className="bg-gray-100 px-1 rounded">/start</code> — the bot replies with your Chat ID</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <p className="text-sm text-gray-700">Paste the Chat ID below and click Connect</p>
                  </li>
                </ol>
                <form onSubmit={(e) => { e.preventDefault(); connectTelegram(); }}>
                  <input
                    type="text"
                    placeholder="Name / Label (e.g. Stephane)"
                    value={telegramLabel}
                    onChange={(e) => setTelegramLabel(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Telegram Chat ID (e.g. 123456789)"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-200"
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  >
                    Connect &amp; Test
                  </button>
                </form>
              </div>
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
                {/* Telegram Button */}
                <button
                  onClick={() => setShowTelegramSetup(true)}
                  title="Manage Telegram notifications"
                  className={`flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-lg transition duration-200 ${
                    telegramConnected
                      ? "bg-blue-400/30 hover:bg-blue-400/50 text-white border border-blue-300/50"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                >
                  <span className="text-base leading-none">✈️</span>
                  <span className="hidden md:inline">
                    {telegramConnected ? `Telegram (${telegramSubscribers.length})` : "Telegram"}
                  </span>
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mt-6 border-b border-white/20 overflow-x-auto">
              <button
                onClick={() => setActiveTab("shipments")}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-t-lg transition duration-200 whitespace-nowrap shrink-0 text-sm md:text-base ${
                  activeTab === "shipments"
                    ? "bg-white text-purple-600 font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Truck className="w-4 h-4 shrink-0" />
                Shipments ({shipments.length})
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-t-lg transition duration-200 whitespace-nowrap shrink-0 text-sm md:text-base ${
                  activeTab === "create"
                    ? "bg-white text-purple-600 font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Plus className="w-4 h-4 shrink-0" />
                Create New
              </button>
              <button
                onClick={() => setActiveTab("feedbacks")}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-t-lg transition duration-200 whitespace-nowrap shrink-0 text-sm md:text-base ${
                  activeTab === "feedbacks"
                    ? "bg-white text-purple-600 font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                Feedbacks ({feedbacks.length})
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 rounded-t-lg transition duration-200 whitespace-nowrap shrink-0 text-sm md:text-base ${
                  activeTab === "security"
                    ? "bg-white text-purple-600 font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setInvoiceShipment(shipment)}
                            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg hover:bg-gray-50 transition text-emerald-600 font-medium border border-emerald-200"
                          >
                            <Receipt className="w-4 h-4" />
                            Invoice
                          </button>
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

                        {/* Status, Progress and Carrier */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Journey Progress
                            </label>
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={Math.round((getEditField(shipment.code, "progress", shipment.progress || 0)) * 100)}
                                onChange={(e) => setEditField(shipment.code, "progress", parseInt(e.target.value) / 100)}
                                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-purple-600"
                              />
                              <span className="text-sm font-bold text-purple-700 min-w-[3rem] text-right">
                                {Math.round((getEditField(shipment.code, "progress", shipment.progress || 0)) * 100)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0-100"
                                value={Math.round((getEditField(shipment.code, "progress", shipment.progress || 0)) * 100)}
                                onChange={(e) => {
                                  const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                                  setEditField(shipment.code, "progress", val / 100);
                                }}
                                className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                              />
                              <button
                                onClick={() => {
                                  const val = getEditField(shipment.code, "progress", shipment.progress || 0);
                                  updateShipmentField(shipment.code, "progress", val);
                                }}
                                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditField(shipment.code, "progress", 0);
                                  updateShipmentField(shipment.code, "progress", 0);
                                }}
                                className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition font-medium"
                              >
                                Reset
                              </button>
                            </div>
                            {shipment.status === 'On Hold' && (
                              <p className="text-xs text-amber-600 mt-1">⚠️ Progress is frozen while on hold</p>
                            )}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mt-2 text-xs text-blue-800 space-y-0.5">
                              <p><strong>📦 Picked up</strong> → set to <strong>10%</strong></p>
                              <p><strong>🚚 In transit</strong> → update to <strong>40%</strong></p>
                              <p><strong>📍 Getting close</strong> → update to <strong>80%</strong></p>
                              <p><strong>✅ Delivered</strong> → set to <strong>100%</strong> & status "Delivered"</p>
                            </div>
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
                                className={`px-4 py-2 rounded-lg transition text-sm font-semibold ${savingFields[shipment.code] ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                                onClick={() => saveEditFields(shipment.code)}
                                disabled={!!savingFields[shipment.code]}
                              >
                                {savingFields[shipment.code] ? 'Saving…' : 'Save'}
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
                            className={`mt-4 text-white px-6 py-2 rounded-lg transition duration-200 font-semibold ${savingFields[shipment.code] ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-orange-500 hover:shadow-lg'}`}
                            onClick={() => saveEditFields(shipment.code)}
                            disabled={!!savingFields[shipment.code]}
                          >
                            {savingFields[shipment.code] ? 'Saving…' : 'Save Pricing'}
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
                            className={`mt-4 text-white px-6 py-2 rounded-lg transition duration-200 font-semibold ${savingFields[shipment.code] ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-orange-500 hover:shadow-lg'}`}
                            onClick={() => saveEditFields(shipment.code)}
                            disabled={!!savingFields[shipment.code]}
                          >
                            {savingFields[shipment.code] ? 'Saving…' : 'Save Shipper & Receiver'}
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
                            className={`mt-4 text-white px-6 py-2 rounded-lg transition duration-200 font-semibold ${savingFields[shipment.code] ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-orange-500 hover:shadow-lg'}`}
                            onClick={() => saveEditFields(shipment.code)}
                            disabled={!!savingFields[shipment.code]}
                          >
                            {savingFields[shipment.code] ? 'Saving…' : 'Save Locations'}
                          </button>
                        </div>

                        {/* Dates */}
                        <div className="border-t pt-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-2">📅 Dates</h4>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 text-xs text-purple-800 space-y-1">
                            <p><strong>Pickup:</strong> Set when you collect the package from the shipper.</p>
                            <p><strong>Expected Delivery:</strong> Your estimated delivery date for the receiver.</p>
                            <p><strong>Actual Delivery:</strong> Leave empty until delivered — set only when the receiver confirms receipt.</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Pickup Date & Time</label>
                              <div className="relative">
                                <DatePicker
                                  selected={getDateInput(shipment.code, "pickup_datetime", shipment)}
                                  onChange={(date) => setDateInput(shipment.code, "pickup_datetime", date)}
                                  showTimeSelect
                                  timeFormat="hh:mm aa"
                                  timeIntervals={15}
                                  dateFormat="MMM d, yyyy h:mm aa"
                                  placeholderText="Select pickup date & time"
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  isClearable
                                  popperPlacement="bottom-start"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Delivery</label>
                              <div className="relative">
                                <DatePicker
                                  selected={getDateInput(shipment.code, "expected_delivery_datetime", shipment)}
                                  onChange={(date) => setDateInput(shipment.code, "expected_delivery_datetime", date)}
                                  showTimeSelect
                                  timeFormat="hh:mm aa"
                                  timeIntervals={15}
                                  dateFormat="MMM d, yyyy h:mm aa"
                                  placeholderText="Select expected delivery date"
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  isClearable
                                  popperPlacement="bottom-start"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Actual Delivery</label>
                              <div className="relative">
                                <DatePicker
                                  selected={getDateInput(shipment.code, "delivery_datetime", shipment)}
                                  onChange={(date) => setDateInput(shipment.code, "delivery_datetime", date)}
                                  showTimeSelect
                                  timeFormat="hh:mm aa"
                                  timeIntervals={15}
                                  dateFormat="MMM d, yyyy h:mm aa"
                                  placeholderText="Set when actually delivered"
                                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                  isClearable
                                  popperPlacement="bottom-start"
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            className={`mt-4 text-white px-6 py-2 rounded-lg transition duration-200 font-semibold ${savingFields[shipment.code] ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-orange-500 hover:shadow-lg'}`}
                            onClick={() => saveDateFields(shipment.code, shipment)}
                            disabled={!!savingFields[shipment.code]}
                          >
                            {savingFields[shipment.code] ? 'Saving…' : 'Save Dates'}
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

        {/* Invoice Modal — for viewing/copying/downloading/sharing any shipment's invoice */}
        {invoiceShipment && (
          <InvoiceModal
            shipment={invoiceShipment}
            products={invoiceShipment.products}
            onClose={() => setInvoiceShipment(null)}
          />
        )}

        {/* Chat Widget */}
        <ChatWidget isAdmin={true} />
      </div>
    </AuthGuard>
  );
}
