'use client'

import { useState, useEffect, useRef } from 'react'
import { adminFetch } from '@/lib/adminApi'

export default function ShipmentEdit({
  code,
  onSaved,
  open = true,
  onClose, // optional, for modal usage
}) {
  const [shipment, setShipment] = useState(null)
  const [busy, setBusy] = useState(false)
  const mounted = useRef(true)

  // Fetch shipment when code changes or modal opens
  useEffect(() => {
    if (!code || !open) return
    mounted.current = true
    setShipment(null) // reset when opening modal
    adminFetch(`/api/shipments/${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted.current) setShipment(data)
      })
      .catch(console.error)
    return () => { mounted.current = false }
  }, [code, open])

  if (!open) return null
  if (!shipment) return (
    <div className="p-4 text-center text-gray-500">Loading shipment...</div>
  )

  const handleSave = async (e) => {
    e.preventDefault()
    setBusy(true)

    const form = Object.fromEntries(new FormData(e.target).entries())
    const payload = {}

    const numericFields = ['qty','length_cm','width_cm','height_cm','weight_kg','current_lat','current_lng']
    const stringFields = ['receiver_name','receiver_address','status']

    stringFields.forEach(k => { if (form[k] !== undefined) payload[k] = form[k] })
    numericFields.forEach(k => { 
      if (form[k] !== undefined) payload[k] = form[k] ? parseFloat(form[k]) : null
    })

    try {
      const res = await adminFetch(`/api/shipments/${code}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      onSaved?.(data) // send full updated shipment
      alert('Saved successfully')
      onClose?.() // close modal if used
    } catch (err) {
      console.error(err)
      alert('Save failed')
    } finally {
      setBusy(false)
    }
  }

  const getDefault = (key, fallback = '') => shipment[key] ?? fallback

  const content = (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-2">
        <input name="receiver_name" defaultValue={getDefault('receiver_name')} placeholder="Receiver name" className="p-2 border rounded w-full"/>
        <input name="receiver_address" defaultValue={getDefault('receiver_address')} placeholder="Receiver address" className="p-2 border rounded w-full"/>
      </div>

      <div className="grid md:grid-cols-3 gap-2">
        <input name="qty" type="number" step="1" defaultValue={getDefault('qty', 1)} placeholder="Qty" className="p-2 border rounded"/>
        <input name="length_cm" type="number" step="0.1" defaultValue={getDefault('length_cm')} placeholder="Length cm" className="p-2 border rounded"/>
        <input name="width_cm" type="number" step="0.1" defaultValue={getDefault('width_cm')} placeholder="Width cm" className="p-2 border rounded"/>
        <input name="height_cm" type="number" step="0.1" defaultValue={getDefault('height_cm')} placeholder="Height cm" className="p-2 border rounded"/>
        <input name="weight_kg" type="number" step="0.01" defaultValue={getDefault('weight_kg')} placeholder="Weight kg" className="p-2 border rounded"/>
      </div>

      <div className="flex gap-2 items-center">
        <select name="status" defaultValue={getDefault('status','On Hold')} className="p-2 border rounded">
          <option>On Hold</option>
          <option>In Transit</option>
          <option>Arrived</option>
        </select>
        <input name="current_lat" type="number" step="0.000001" defaultValue={getDefault('current_lat')} placeholder="Current lat" className="p-2 border rounded"/>
        <input name="current_lng" type="number" step="0.000001" defaultValue={getDefault('current_lng')} placeholder="Current lng" className="p-2 border rounded"/>
      </div>

      <div className="flex justify-end gap-2">
        {onClose && <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>}
        <button type="submit" disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded">
          {busy ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )

  // Render inline or modal
  return onClose ? (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full p-4 rounded shadow">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Edit Shipment {code}</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>
        {content}
      </div>
    </div>
  ) : content
}
