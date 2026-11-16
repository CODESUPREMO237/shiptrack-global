"use client"

import { useState, useEffect } from "react"
import { use } from "react" // Import React.use()
import ShipmentDetails from "@/components/ShipmentDetails"
import ChatWidget from "@/components/ChatWidget"
import Navbar from "@/components/Navbar"
import { Package } from "lucide-react"

export default function TrackWithCode({ params }) {
  // ✅ FIX: Unwrap the params Promise using React.use()
  const unwrappedParams = use(params)
  const trackingCode = unwrappedParams.code?.toUpperCase()

  const [shipment, setShipment] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShipment = async () => {
      if (!trackingCode) {
        setError("Invalid tracking code")
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/tracking/${trackingCode}`)
        const data = await res.json()

        if (data.error) {
          setError(data.error)
        } else {
          setShipment(data)
        }
      } catch (error) {
        setError("Error fetching shipment details")
      }
      setLoading(false)
    }

    fetchShipment()
  }, [trackingCode])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showFullNav={false} />

      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
            <p className="text-lg text-gray-600">Loading shipment details...</p>
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Package className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Tracking Error</h2>
            <p className="mb-6 text-red-600">{error}</p>
            <a
              href="/track"
              className="inline-block rounded-xl bg-[#4D148C] px-6 py-3 font-semibold text-white transition hover:shadow-lg"
            >
              Try Another Code
            </a>
          </div>
        </div>
      ) : (
        <div className="pb-8">
          <ShipmentDetails initialShipment={shipment} />
        </div>
      )}

      <ChatWidget />
    </div>
  )
}