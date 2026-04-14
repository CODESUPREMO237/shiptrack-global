'use client'

import { useState } from 'react'
import { adminFetch } from '@/lib/adminApi'

export default function ShipmentAdminControls({ code, onUpdated }) {
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    receiver_name: '',
    receiver_address: '',
    status: 'On Hold',
    current_lat: '',
    current_lng: '',
  })

  const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const patchShipment = async () => {
    setBusy(true)
    try {
      const payload = {}
      if (form.receiver_name) payload.receiver_name = form.receiver_name
      if (form.receiver_address) payload.receiver_address = form.receiver_address
      if (form.status) payload.status = form.status

      const res = await adminFetch(`/api/shipments/${code}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Patch failed')
      onUpdated?.(payload)
      alert('Shipment updated')
    } catch (err) {
      console.error(err)
      alert('Update failed')
    } finally {
      setBusy(false)
    }
  }

  const updateLocation = async () => {
    if (!form.current_lat || !form.current_lng) return alert('Enter coords')
    setBusy(true)
    try {
      const res = await adminFetch('/api/update-location', {
        method: 'POST',
        body: JSON.stringify({
          code,
          lat: parseFloat(form.current_lat),
          lng: parseFloat(form.current_lng),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      onUpdated?.({ current_lat: parseFloat(form.current_lat), current_lng: parseFloat(form.current_lng) })
      alert('Location updated')
    } catch (err) {
      console.error(err)
      alert('Location update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border p-3 rounded">
      <div className="grid md:grid-cols-2 gap-2">
        <input placeholder="Receiver name" value={form.receiver_name} onChange={handle('receiver_name')} className="p-2 border"/>
        <input placeholder="Receiver address" value={form.receiver_address} onChange={handle('receiver_address')} className="p-2 border"/>
      </div>

      <div className="flex gap-2 items-center mt-2">
        <select value={form.status} onChange={handle('status')} className="p-2 border">
          <option>On Hold</option>
          <option>In Transit</option>
          <option>Arrived</option>
        </select>
        <button disabled={busy} onClick={patchShipment} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
      </div>

      <div className="mt-3 grid md:grid-cols-3 gap-2">
        <input placeholder="Current lat" value={form.current_lat} onChange={handle('current_lat')} className="p-2 border"/>
        <input placeholder="Current lng" value={form.current_lng} onChange={handle('current_lng')} className="p-2 border"/>
        <button disabled={busy} onClick={updateLocation} className="bg-blue-600 text-white px-3 py-1 rounded">Update Location</button>
      </div>
    </div>
  )
}
