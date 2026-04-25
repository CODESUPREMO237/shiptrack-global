'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import ShipmentHistory from "@/components/ShipmentHistory"
import ShipmentQRCode from "@/components/ShipmentQRCode"
import {
  Clock, Calendar, Package, MapPin, User, Mail, Phone, Truck,
  AlertCircle, TrendingUp, Navigation, DollarSign, Shield, Globe,
  FileText, Scale, Tag, CheckCircle, Circle, ChevronDown, ChevronUp
} from 'lucide-react'

const MapLeaflet = dynamic(() => import('./MapLeaflet'), { ssr: false })

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// FedEx-style 4-step milestone stepper
const MILESTONES = [
  { key: 'picked_up', label: 'Picked Up', icon: Package },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Navigation },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
]

function getMilestoneIndex(status) {
  if (status === 'Delivered') return 3
  if (status === 'In Transit') return 1
  if (status === 'On Hold') return 1
  if (status === 'Cancelled') return 1
  return 0
}

function ShipmentStepper({ status }) {
  const active = getMilestoneIndex(status)
  const isCancelled = status === 'Cancelled'

  return (
    <div className="w-full py-5 px-2">
      <div className="flex items-center">
        {MILESTONES.map((step, i) => {
          const Icon = step.icon
          const done = i < active
          const current = i === active
          const isLast = i === MILESTONES.length - 1

          let circleStyle = 'bg-white border-2 border-gray-300 text-gray-400'
          if (isCancelled && i <= active) {
            circleStyle = 'bg-red-500 border-red-500 text-white'
          } else if (done) {
            circleStyle = 'text-white border-0'
          } else if (current) {
            circleStyle = 'text-white border-0 ring-4 ring-offset-1'
          }

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${circleStyle}`}
                  style={
                    done && !isCancelled
                      ? { backgroundColor: 'var(--brand-primary)' }
                      : current && !isCancelled
                      ? { backgroundColor: 'var(--brand-accent)', ringColor: 'var(--brand-accent-light)' }
                      : {}
                  }
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className="text-xs font-medium text-center leading-tight"
                  style={{
                    color: (done || current) && !isCancelled ? 'var(--brand-primary)' : isCancelled && i <= active ? '#c81e1e' : '#9ca3af',
                    maxWidth: '72px',
                  }}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 mt-[-14px]"
                  style={{
                    backgroundColor: isCancelled && i < active ? '#fca5a5' : done ? 'var(--brand-primary)' : '#e5e7eb'
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const statusColors = {
  'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'In Transit': 'bg-blue-100 text-blue-800 border-blue-200',
  'Delivered': 'bg-green-100 text-green-800 border-green-200',
  'Cancelled': 'bg-red-100 text-red-800 border-red-200',
}

function getStatusBanner(status) {
  if (status === 'Delivered') return { bg: '#057a55', label: 'Delivered' }
  if (status === 'In Transit') return { bg: 'var(--brand-primary)', label: 'In Transit' }
  if (status === 'On Hold') return { bg: '#c27803', label: 'Shipment On Hold' }
  if (status === 'Cancelled') return { bg: '#c81e1e', label: 'Shipment Cancelled' }
  return { bg: 'var(--brand-primary)', label: status }
}

export default function ShipmentDetails({ initialShipment, isAdmin = false }) {
  const [shipment, setShipment] = useState(initialShipment ?? null)
  const [location, setLocation] = useState({
    lat: initialShipment?.current_lat ?? null,
    lng: initialShipment?.current_lng ?? null,
  })
  const [activeTab, setActiveTab] = useState('details')
  const [email, setEmail] = useState('')
  const [notifyMessage, setNotifyMessage] = useState('')
  const [polling, setPolling] = useState(true)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const mounted = useRef(false)
  const pollingIntervalRef = useRef(null)

  const fmt = (v) => (v === null || v === undefined || v === '' ? '—' : v)

  // Always use the admin-set progress from DB
  const calculatedProgress = useMemo(() => {
    return shipment?.progress ?? 0
  }, [shipment])

  const eta = useMemo(() => {
    if (!shipment?.created_at || !location.lat || !location.lng) return { time: 'Calculating...', hours: 'N/A' }
    const originLat = shipment.origin_lat
    const originLng = shipment.origin_lng
    const totalDistance = calculateDistance(originLat, originLng, shipment.dest_lat, shipment.dest_lng)
    const traveledDistance = calculateDistance(originLat, originLng, location.lat, location.lng)
    const remainingDistance = Math.max(0, totalDistance - traveledDistance)
    const hoursInTransit = (Date.now() - new Date(shipment.created_at).getTime()) / (1000 * 60 * 60)
    const avgSpeed = traveledDistance / (hoursInTransit || 1)
    const etaHours = remainingDistance / (avgSpeed || 1)
    const arrivalTime = new Date(Date.now() + etaHours * 3600000)
    return {
      hours: etaHours.toFixed(1),
      time: arrivalTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }
  }, [shipment, location])

  useEffect(() => {
    if (!initialShipment?.code) return
    mounted.current = true

    const fetchShipment = async () => {
      try {
        const res = await fetch(`/api/tracking/${initialShipment.code}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (!mounted.current) return
        setShipment(data)
        const statusStopsMovement = ['On Hold', 'Cancelled', 'Delivered'].includes(data.status)
        setLocation({ lat: data.current_lat ?? null, lng: data.current_lng ?? null })
        if (statusStopsMovement) {
          setPolling(false)
        }
      } catch (err) {
        console.error('Polling error', err)
      }
    }

    fetchShipment()
    pollingIntervalRef.current = setInterval(() => {
      if (polling) fetchShipment()
    }, 3000)

    return () => {
      mounted.current = false
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [initialShipment?.code, polling])

  const handleNotifySubmit = async (e) => {
    e.preventDefault()
    if (!email) return setNotifyMessage('Please enter your email')
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, shipmentCode: shipment?.code }),
      })
      const data = await res.json()
      setNotifyMessage(data.message || 'Notification request submitted!')
    } catch {
      setNotifyMessage('Something went wrong')
    }
  }

  if (!shipment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-gray-200 mb-4" style={{ borderTopColor: 'var(--brand-primary)' }} />
          <p className="text-gray-500 text-sm">Loading tracking details...</p>
        </div>
      </div>
    )
  }

  const displayStatus = shipment.status === 'On Hold' ? 'Stopped' : shipment.status
  const progressPct = Math.min(100, Math.round(calculatedProgress * 100))
  const isInternational = shipment.hs_code || shipment.incoterm
  const banner = getStatusBanner(shipment.status)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Status Banner (full width, like FedEx) ── */}
      <div className="text-white py-5 px-4" style={{ backgroundColor: banner.bg }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="text-white/70 text-xs uppercase tracking-wider mb-1 font-medium">Shipment Status</div>
            <div className="text-2xl md:text-3xl font-bold">{banner.label}</div>
            <div className="text-white/80 text-sm mt-1">{shipment.name} &nbsp;·&nbsp; <span className="font-mono">{shipment.code}</span></div>
          </div>
          <div className="text-right">
            <div className="text-white/70 text-xs uppercase tracking-wider mb-1">Estimated Arrival</div>
            <div className="text-xl font-bold">
              {shipment.status === 'Delivered'
                ? (shipment.delivery_datetime ? format(new Date(shipment.delivery_datetime), 'MMM d, yyyy') : 'Delivered')
                : shipment.expected_delivery_datetime
                  ? format(new Date(shipment.expected_delivery_datetime), 'MMM d, yyyy')
                  : eta.time}
            </div>
            {shipment.status === 'On Hold' && (
              <div className="text-white/60 text-xs mt-0.5">Shipment paused</div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── Milestone Stepper ── */}
        <div className="bg-white rounded-lg border border-gray-200 px-5">
          <ShipmentStepper status={shipment.status} />
          {/* Progress bar below stepper */}
          <div className="pb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>Journey progress</span>
              <span className="font-medium" style={{ color: 'var(--brand-primary)' }}>{progressPct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, backgroundColor: shipment.status === 'Cancelled' ? '#ef4444' : shipment.status === 'Delivered' ? '#057a55' : 'var(--brand-primary)' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Last updated: {shipment.updated_at ? new Date(shipment.updated_at).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        {/* ── Admin notice ── */}
        {shipment.admin_comment && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-900 text-sm mb-1">Notice from Administration</div>
              <p className="text-red-800 text-sm whitespace-pre-line">{shipment.admin_comment}</p>
            </div>
          </div>
        )}

        {/* ── Map ── */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
            <span className="font-semibold text-gray-900 text-sm">Live Tracking Map</span>
          </div>
          <div className="h-72">
            <MapLeaflet
              lat={location.lat}
              lng={location.lng}
              originLat={shipment.origin_lat ?? initialShipment?.current_lat}
              originLng={shipment.origin_lng ?? initialShipment?.current_lng}
              destLat={shipment.dest_lat}
              destLng={shipment.dest_lng}
              status={shipment.status}
            />
          </div>
        </div>

        {/* ── Tabs (non-admin) ── */}
        {!isAdmin && (
          <div className="flex border-b border-gray-200 bg-white rounded-t-lg overflow-hidden">
            {['details', 'notify'].map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-3 text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-white border-b-2'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={activeTab === tab ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'details' ? '📦 Details' : '🔔 Notify Me'}
              </button>
            ))}
          </div>
        )}

        {/* ── Details tab ── */}
        {((!isAdmin && activeTab === 'details') || isAdmin) && (
          <div className="space-y-4">

            {/* Shipper & Receiver — side by side */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--brand-primary-light)' }}>
                    <User className="w-3.5 h-3.5" style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">Shipper</span>
                </div>
                <p className="text-gray-900 font-medium text-sm">{fmt(shipment.shipper_name)}</p>
                <p className="text-gray-500 text-xs mt-1 flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />{fmt(shipment.shipper_address)}</p>
                <p className="text-gray-500 text-xs mt-1 flex items-center gap-1.5"><Phone className="w-3 h-3" />{fmt(shipment.shipper_phone)}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--brand-accent-light)' }}>
                    <User className="w-3.5 h-3.5" style={{ color: 'var(--brand-accent)' }} />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">Receiver</span>
                </div>
                <p className="text-gray-900 font-medium text-sm">{fmt(shipment.receiver_name)}</p>
                <p className="text-gray-500 text-xs mt-1 flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />{fmt(shipment.receiver_address)}</p>
                <p className="text-gray-500 text-xs mt-1 flex items-center gap-1.5"><Phone className="w-3 h-3" />{fmt(shipment.receiver_phone)}</p>
                <p className="text-gray-500 text-xs mt-1 flex items-center gap-1.5"><Mail className="w-3 h-3" />{fmt(shipment.receiver_email)}</p>
                {shipment.delivery_signature_required && (
                  <p className="text-xs font-medium mt-2" style={{ color: 'var(--brand-primary)' }}>✓ Signature required on delivery</p>
                )}
              </div>
            </div>

            {/* ETA row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(() => {
                // Calculate travel time from actual dates
                let travelTimeDisplay = '—';
                const pickupDt = shipment.pickup_datetime ? new Date(shipment.pickup_datetime) : null;
                const expectedDt = shipment.expected_delivery_datetime ? new Date(shipment.expected_delivery_datetime) : null;
                const actualDt = shipment.delivery_datetime ? new Date(shipment.delivery_datetime) : null;

                const endDt = actualDt || expectedDt;
                if (pickupDt && endDt && !isNaN(pickupDt) && !isNaN(endDt)) {
                  const diffMs = endDt.getTime() - pickupDt.getTime();
                  const diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));
                  if (diffHrs >= 24) {
                    const days = Math.floor(diffHrs / 24);
                    const hrs = Math.round(diffHrs % 24);
                    travelTimeDisplay = `${days}d ${hrs}h`;
                  } else {
                    travelTimeDisplay = `${diffHrs.toFixed(1)} hrs`;
                  }
                }

                return [
                  { label: 'Est. travel time', value: travelTimeDisplay, icon: Clock },
                  { label: 'Actual delivery', value: shipment.delivery_datetime ? format(new Date(shipment.delivery_datetime), 'MMM d, yyyy, h:mm a') : (shipment.status === 'Delivered' ? 'Delivered' : 'Pending'), icon: Calendar },
                  { label: 'Est. arrival', value: shipment.status === 'Delivered' ? 'Delivered' : shipment.expected_delivery_datetime ? format(new Date(shipment.expected_delivery_datetime), 'MMM d, yyyy, h:mm a') : eta.time, icon: TrendingUp },
                  { label: 'Pickup time', value: shipment.pickup_datetime ? format(new Date(shipment.pickup_datetime), 'MMM d, yyyy, h:mm a') : '—', icon: Package },
                ];
              })().map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                    <Icon className="w-4 h-4 text-gray-400 mb-2" />
                    <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                    <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                  </div>
                )
              })}
            </div>

            {/* Shipment info row */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                <span className="font-semibold text-gray-900 text-sm">Shipment Information</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Carrier', value: fmt(shipment.agency) },
                  { label: 'Carrier ref', value: fmt(shipment.carrier_ref) },
                  { label: 'Payment mode', value: fmt(shipment.payment_mode) },
                  shipment.current_vehicle_id && { label: 'Vehicle ID', value: shipment.current_vehicle_id },
                  shipment.current_driver_id && { label: 'Driver ID', value: shipment.current_driver_id },
                  shipment.shipment_category && { label: 'Category', value: shipment.shipment_category },
                ].filter(Boolean).map((f, i) => (
                  <div key={i} className="bg-gray-50 rounded p-2.5">
                    <div className="text-xs text-gray-500 mb-0.5">{f.label}</div>
                    <div className="text-sm font-medium text-gray-900">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Finance info (if present) */}
            {(shipment.total_cost || shipment.insurance || shipment.client_id) && (
              <div className="grid md:grid-cols-3 gap-3">
                {shipment.client_id && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Client ID</div>
                      <div className="text-sm font-semibold text-gray-900">{shipment.client_id}</div>
                    </div>
                  </div>
                )}
                {shipment.total_cost && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Total Cost</div>
                      <div className="text-sm font-semibold text-gray-900">{shipment.currency || 'USD'} {parseFloat(shipment.total_cost).toFixed(2)}</div>
                      <div className="text-xs text-gray-400">{shipment.payment_status}</div>
                    </div>
                  </div>
                )}
                {shipment.insurance && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">Insurance</div>
                      <div className="text-sm font-semibold text-gray-900">{shipment.currency || 'USD'} {parseFloat(shipment.insurance_value || 0).toFixed(2)}</div>
                      <div className="text-xs text-green-600 font-medium">✓ Insured</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Package details table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                <span className="font-semibold text-gray-900 text-sm">Package Details</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">Qty</th>
                      <th className="px-4 py-2.5 text-left font-medium">Type</th>
                      <th className="px-4 py-2.5 text-left font-medium">Product</th>
                      <th className="px-4 py-2.5 text-left font-medium">Description</th>
                      <th className="px-4 py-2.5 text-left font-medium">Dimensions (cm)</th>
                      <th className="px-4 py-2.5 text-left font-medium">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shipment.products?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{fmt(p.qty)}</td>
                        <td className="px-4 py-2.5 text-gray-700">{fmt(p.piece_type)}</td>
                        <td className="px-4 py-2.5 text-gray-700">{fmt(p.product)}</td>
                        <td className="px-4 py-2.5 text-gray-700">{fmt(p.description)}</td>
                        <td className="px-4 py-2.5 text-gray-700">{fmt(p.length_cm)} × {fmt(p.width_cm)} × {fmt(p.height_cm)}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{fmt(p.weight_kg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Collapsible "more details" section */}
            <button
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between transition"
            >
              <span>Additional Details (weight, customs, transit hubs)</span>
              {showMoreDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {showMoreDetails && (
              <div className="space-y-4">
                {/* Weight & Handling */}
                {(shipment.total_weight || shipment.volumetric_weight) && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Scale className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                      <span className="font-semibold text-gray-900 text-sm">Weight & Handling</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {shipment.total_weight && (
                        <div className="bg-gray-50 rounded p-2.5">
                          <div className="text-xs text-gray-500 mb-0.5">Total weight</div>
                          <div className="text-sm font-semibold text-gray-900">{parseFloat(shipment.total_weight).toFixed(2)} kg</div>
                        </div>
                      )}
                      {shipment.volumetric_weight && (
                        <div className="bg-gray-50 rounded p-2.5">
                          <div className="text-xs text-gray-500 mb-0.5">Volumetric weight</div>
                          <div className="text-sm font-semibold text-gray-900">{parseFloat(shipment.volumetric_weight).toFixed(2)} kg</div>
                        </div>
                      )}
                      {shipment.total_weight && shipment.volumetric_weight && (
                        <div className="bg-gray-50 rounded p-2.5">
                          <div className="text-xs text-gray-500 mb-0.5">Chargeable weight</div>
                          <div className="text-sm font-semibold text-gray-900">{Math.max(parseFloat(shipment.total_weight), parseFloat(shipment.volumetric_weight)).toFixed(2)} kg</div>
                        </div>
                      )}
                      {shipment.special_handling && shipment.special_handling.length > 0 && (
                        <div className="bg-gray-50 rounded p-2.5">
                          <div className="text-xs text-gray-500 mb-1">Special handling</div>
                          <div className="flex flex-wrap gap-1">
                            {shipment.special_handling.map((tag, i) => (
                              <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customs */}
                {isInternational && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                      <span className="font-semibold text-gray-900 text-sm">Customs Information</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      {shipment.hs_code && <div className="bg-gray-50 rounded p-2.5"><div className="text-xs text-gray-500 mb-0.5">HS Code</div><div className="text-sm font-medium text-gray-900">{shipment.hs_code}</div></div>}
                      {shipment.incoterm && <div className="bg-gray-50 rounded p-2.5"><div className="text-xs text-gray-500 mb-0.5">Incoterm</div><div className="text-sm font-medium text-gray-900">{shipment.incoterm}</div></div>}
                      {shipment.country_of_manufacture && <div className="bg-gray-50 rounded p-2.5"><div className="text-xs text-gray-500 mb-0.5">Country of manufacture</div><div className="text-sm font-medium text-gray-900">{shipment.country_of_manufacture}</div></div>}
                      {shipment.customs_declaration_description && <div className="bg-gray-50 rounded p-2.5 md:col-span-3"><div className="text-xs text-gray-500 mb-0.5">Customs declaration</div><div className="text-sm text-gray-700">{shipment.customs_declaration_description}</div></div>}
                    </div>
                  </div>
                )}

                {/* Transit hubs */}
                {shipment.transit_hubs && shipment.transit_hubs.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Navigation className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                      <span className="font-semibold text-gray-900 text-sm">Transit Hubs</span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      {shipment.transit_hubs.map((hub, i) => (
                        <div key={i} className="bg-gray-50 rounded p-2.5">
                          <div className="text-sm font-medium text-gray-900">{hub.name || `Hub ${i + 1}`}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{hub.location}</div>
                          {hub.timestamp && <div className="text-xs text-gray-400 mt-0.5">{new Date(hub.timestamp).toLocaleString()}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {shipment.customs_docs && shipment.customs_docs.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                      <span className="font-semibold text-gray-900 text-sm">Customs Documents</span>
                    </div>
                    <div className="space-y-2">
                      {shipment.customs_docs.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded hover:bg-gray-100 transition">
                          <div className="flex items-center gap-2 text-sm text-gray-800">
                            <FileText className="w-4 h-4 text-gray-400" />
                            {doc.name || `Document ${i + 1}`}
                          </div>
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>
                              View →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tracking history */}
            {shipment.tracking_history && shipment.tracking_history.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                  <span className="font-semibold text-gray-900 text-sm">Tracking History</span>
                </div>
                <div className="space-y-3">
                  {shipment.tracking_history.map((event, idx) => (
                    <div key={idx} className="flex gap-3 relative">
                      {idx !== shipment.tracking_history.length - 1 && (
                        <div className="absolute left-[14px] top-8 w-0.5 h-full bg-gray-100" />
                      )}
                      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center z-10"
                        style={{ backgroundColor: 'var(--brand-primary)' }}>
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium text-gray-900 text-sm">{event.event}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />{event.location}
                        </p>
                        {event.reason && <p className="text-xs text-gray-500 mt-1 italic">{event.reason}</p>}
                        {event.status && (
                          <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[event.status] || 'bg-gray-100 text-gray-700'}`}>
                            {event.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <ShipmentHistory shipmentCode={shipment.code} />
              </div>
            )}

            {/* QR Code + labels at bottom */}
            <div className="flex justify-center py-2">
              <ShipmentQRCode code={shipment.code} />
            </div>
          </div>
        )}

        {/* ── Notify Me tab ── */}
        {!isAdmin && activeTab === 'notify' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--brand-primary-light)' }}>
                <Mail className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Get Delivery Notifications</h2>
              <p className="text-gray-500 text-sm">Enter your email to receive updates about this shipment</p>
            </div>
            <form onSubmit={handleNotifySubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'var(--brand-primary)' }}
                required
              />
              <button
                type="submit"
                className="w-full py-3 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                <Mail className="w-4 h-4" />
                Subscribe to Updates
              </button>
            </form>
            {notifyMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${notifyMessage.includes('submitted') || notifyMessage.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {notifyMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
