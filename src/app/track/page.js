"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ShipmentDetails from "@/components/ShipmentDetails"
import ChatWidget from "@/components/ChatWidget"
import Navbar from "@/components/Navbar"
import { Search, Package, MapPin, TrendingUp, Shield } from "lucide-react"

function TrackContent() {
  const [code, setCode] = useState("")
  const [shipment, setShipment] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  // Auto-track if ?code= is in URL (from Navbar or homepage)
  useEffect(() => {
    const urlCode = searchParams.get("code")
    if (urlCode) {
      setCode(urlCode.toUpperCase())
      doTrack(urlCode.toUpperCase())
    }
  }, [])

  const doTrack = async (trackCode) => {
    const trimmed = (trackCode || code).trim()
    if (!trimmed) { setError("Please enter a tracking code"); return }
    setError("")
    setShipment(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/tracking/${trimmed}`)
      const data = await res.json()
      if (data.error) setError(data.error)
      else setShipment(data)
    } catch {
      setError("Error fetching shipment details")
    }
    setLoading(false)
  }

  const handleTrack = async () => { doTrack() }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showFullNav={false} />

      {!shipment ? (
        <>
          {/* Hero */}
          <div className="relative text-white py-16 overflow-hidden" style={{ backgroundColor: "var(--brand-primary)" }}>
            <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mb-5">
                <Package className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3">Track Your Shipment</h1>
              <p className="text-white/85 text-base md:text-lg">
                Real-time tracking across the globe. Enter your tracking number below.
              </p>
            </div>
          </div>

          {/* Search card — overlaps hero */}
          <div className="max-w-2xl mx-auto px-4 -mt-8 relative z-20">
            <div className="bg-white rounded-lg shadow-xl p-6 border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tracking number</label>
              <div className="flex gap-0 rounded-md overflow-hidden border border-gray-300 focus-within:border-[#4D148C] focus-within:ring-1 focus-within:ring-[#4D148C] transition mb-3">
                <div className="flex items-center pl-3">
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. SHPGMQTPE"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                  className="flex-1 px-3 py-3 text-gray-900 bg-white outline-none text-sm"
                />
                <button
                  onClick={handleTrack}
                  disabled={loading}
                  className="px-5 py-3 text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--brand-accent)" }}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {loading ? "Searching..." : "Track"}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
                  <Package className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3">
                Tracking codes are 6–12 characters. Check your confirmation email if unsure.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="max-w-4xl mx-auto px-4 py-14">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: <MapPin className="w-5 h-5" />, title: "Real-time updates", desc: "GPS-powered location updates and estimated delivery times" },
                { icon: <TrendingUp className="w-5 h-5" />, title: "Full journey timeline", desc: "Visual progress from pickup to delivery with every event logged" },
                { icon: <Shield className="w-5 h-5" />, title: "Secure & private", desc: "Your tracking data is encrypted and accessible only to you" },
              ].map((f, i) => (
                <div key={i} className="flex gap-4 p-5 bg-white rounded-lg border border-gray-200">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--brand-primary-light)", color: "var(--brand-primary)" }}>
                    {f.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm mb-1">{f.title}</div>
                    <div className="text-gray-500 text-xs leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support CTA */}
          <div className="py-10 border-t border-gray-200 text-center bg-white">
            <p className="text-gray-500 text-sm mb-3">Can't find your shipment?</p>
            <a
              href="/support"
              className="inline-block px-6 py-2.5 text-white text-sm font-semibold rounded transition"
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              Contact Support
            </a>
          </div>
        </>
      ) : (
        <div className="pb-8">
          <ShipmentDetails initialShipment={shipment} />
        </div>
      )}

      <ChatWidget />
    </div>
  )
}

export default function Track() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4D148C] border-t-transparent" /></div>}>
      <TrackContent />
    </Suspense>
  )
}
