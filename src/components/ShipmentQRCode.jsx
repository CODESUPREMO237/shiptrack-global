'use client'

import { QRCodeCanvas } from 'qrcode.react'

export default function ShipmentQRCode({ code }) {
  // Reads the deployed domain from .env (NEXT_PUBLIC_SITE_URL) so it can be changed
  // per-deployment without touching code. Falls back to the current origin if unset.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  const url = `${baseUrl}/track?code=${code}`

  return (
    <div className="text-center my-6">
      {/* QR code linking directly to shipment details */}
      <QRCodeCanvas
        value={url}          // QR code contains the full tracking URL
        size={160}           
        bgColor="#ffffff"
        fgColor="#000000"
        level="H"
        includeMargin={true}
      />
      <div className="mt-2 text-gray-700 font-semibold">{code}-CARGO</div>
    </div>
  )
}
