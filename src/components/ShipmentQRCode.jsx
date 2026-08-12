'use client'

import { QRCodeCanvas } from 'qrcode.react'

export default function ShipmentQRCode({ code }) {
  // Hardcoded to the new domain to ensure it doesn't use old Vercel environment variables
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/track?code=${code}`

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
