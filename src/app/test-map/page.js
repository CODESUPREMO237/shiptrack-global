// Quick debug page to test antimeridian map routing
// Visit http://localhost:3000/test-map to see the result

'use client'
import dynamic from 'next/dynamic'

const MapLeaflet = dynamic(() => import('@/components/MapLeaflet'), { ssr: false })

export default function TestMapPage() {
  // Test case: Australia (Sydney) → US (Houston, Texas)
  // This route SHOULD cross the Pacific Ocean, NOT go through Africa
  const originLat = -33.8688    // Sydney, Australia
  const originLng = 151.2093
  const destLat = 29.7604       // Houston, Texas, USA
  const destLng = -95.3698
  
  // Current position = at origin (shipment just created)
  const currentLat = originLat
  const currentLng = originLng

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 10 }}>Antimeridian Test: Australia → US</h1>
      <p style={{ marginBottom: 5 }}>
        Origin: Sydney ({originLat}, {originLng}) | 
        Dest: Houston ({destLat}, {destLng}) |
        Current: ({currentLat}, {currentLng})
      </p>
      <p style={{ marginBottom: 20, color: 'red', fontWeight: 'bold' }}>
        ✅ Route should go EAST across the Pacific Ocean<br/>
        ❌ Route should NOT go WEST through Africa
      </p>
      <div style={{ height: 500, border: '2px solid #333' }}>
        <MapLeaflet
          lat={currentLat}
          lng={currentLng}
          originLat={originLat}
          originLng={originLng}
          destLat={destLat}
          destLng={destLng}
          status="In Transit"
        />
      </div>
      
      <h2 style={{ marginTop: 30, marginBottom: 10 }}>Test 2: With ship mid-Pacific</h2>
      <div style={{ height: 500, border: '2px solid #333' }}>
        <MapLeaflet
          lat={5.0}
          lng={-170.0}
          originLat={originLat}
          originLng={originLng}
          destLat={destLat}
          destLng={destLng}
          status="In Transit"
        />
      </div>
    </div>
  )
}
