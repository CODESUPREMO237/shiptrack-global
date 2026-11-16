'use client'

import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-pulse-icon'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const DEFAULT_CENTER_LAT = 39.8283
const DEFAULT_CENTER_LNG = -98.5795

const shipIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3208/3208358.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
})

const safeParseFloat = (val) => {
  const parsed = parseFloat(val)
  return isNaN(parsed) ? null : parsed
}

/** Adjust lng2 so it takes the shortest path from lng1 (may exceed ±180). */
function adjustLng(refLng, lng) {
  if (refLng == null || lng == null) return lng
  const diff = lng - refLng
  if (diff > 180) return lng - 360
  if (diff < -180) return lng + 360
  return lng
}

/** Does the shortest path cross the ±180° meridian? */
function crossesAntimeridian(lng1, lng2) {
  if (lng1 == null || lng2 == null) return false
  return Math.abs(lng2 - lng1) > 180
}

/**
 * Generate Bezier-curved waypoints between two points.
 * The curve arcs AWAY from the destination direction (like a real
 * shipping route going through the ocean, not over land).
 * Coordinates are NOT normalised — caller decides wrapping.
 */
function bezierWaypoints(fromLat, fromLng, toLat, toLng, numPoints) {
  const latDiff = toLat - fromLat
  const controlLat = fromLat - latDiff * 0.15 // push opposite to dest
  const pts = []
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const u = 1 - t
    const lat = u * u * fromLat + 2 * u * t * controlLat + t * t * toLat
    const lng = fromLng + t * (toLng - fromLng) // linear for lng
    pts.push([lat, lng])
  }
  return pts
}

export default function MapLeaflet({ lat, lng, originLat, originLng, destLat, destLng, status }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const routeRef = useRef(null)
  const dashedRef = useRef(null)
  const animationRef = useRef(null)
  const prevStatusRef = useRef(status)

  const currentLat = safeParseFloat(lat)
  const currentLng = safeParseFloat(lng)
  const startLat = safeParseFloat(originLat)
  const startLng = safeParseFloat(originLng)
  const destinationLat = safeParseFloat(destLat)
  const destinationLng = safeParseFloat(destLng)

  const solidStyle = { color: '#0f76e6', weight: 4, opacity: 0.9 }
  const dashedStyle = { color: '#e63946', weight: 3, dashArray: '8 10', opacity: 0.8 }
  const easeOut = (t) => 1 - (1 - t) * (1 - t)

  // Route crosses antimeridian?
  const routeCrossesAM = crossesAntimeridian(startLng, destinationLng)

  // For AM-crossing routes, compute unwrapped longitudes (may exceed ±180)
  const adjDestLng = routeCrossesAM ? adjustLng(startLng, destinationLng) : destinationLng
  const adjCurrentLng = routeCrossesAM ? adjustLng(startLng, currentLng) : currentLng

  // ── Initialise map ──
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      let mapCenter, mapZoom

      if (routeCrossesAM && startLng != null && adjDestLng != null) {
        // Center the map on the MIDPOINT of the unwrapped route.
        // For Australia (145°) → US (265°), center is at 205° (Pacific).
        // This shows Australia on the LEFT and Americas on the RIGHT
        // with the Pacific in the CENTER — one continuous view.
        const midLat = (startLat + destinationLat) / 2
        const midLng = (startLng + adjDestLng) / 2
        mapCenter = [midLat, midLng]
        mapZoom = 2
      } else {
        mapCenter = [DEFAULT_CENTER_LAT, DEFAULT_CENTER_LNG]
        mapZoom = 4
      }

      const map = L.map(mapRef.current, {
        zoomControl: true,
        worldCopyJump: false,
      }).setView(mapCenter, mapZoom)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      // ── Markers ──
      // For AM routes, place markers at UNWRAPPED coordinates so they appear
      // on the Pacific-centered view.
      const shipLat = currentLat || startLat || DEFAULT_CENTER_LAT
      const shipLng = routeCrossesAM ? (adjCurrentLng || startLng || DEFAULT_CENTER_LNG)
                                     : (currentLng || startLng || DEFAULT_CENTER_LNG)

      const marker = L.marker([shipLat, shipLng], { icon: shipIcon })
        .addTo(map).bindPopup('Current Location')
      markerRef.current = marker

      // Origin marker (green circle)
      if (startLat != null && startLng != null) {
        const originIcon = L.divIcon({
          html: '<div style="background:#10b981;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(0,0,0,0.5);"></div>',
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
        L.marker([startLat, startLng], { icon: originIcon }).addTo(map).bindPopup('Origin')
      }

      // Destination pulse marker
      if (destinationLat != null && destinationLng != null) {
        const destMarkerLng = routeCrossesAM ? adjDestLng : destinationLng
        L.marker([destinationLat, destMarkerLng], {
          icon: L.icon.pulse({ iconSize: [18, 18], color: 'red', fillColor: 'red' }),
        }).addTo(map).bindPopup('Destination')
      }

      // ── Draw route ──
      const cLat = currentLat || startLat
      const cLng = routeCrossesAM ? (adjCurrentLng || startLng) : (currentLng || startLng)

      if (routeCrossesAM) {
        // === TRANS-PACIFIC: continuous curved polyline using unwrapped coords ===
        const bluePoints = bezierWaypoints(startLat, startLng, cLat, cLng, 40)
        routeRef.current = L.polyline(bluePoints, solidStyle).addTo(map)

        if (destinationLat != null && adjDestLng != null) {
          const redPoints = bezierWaypoints(cLat, cLng, destinationLat, adjDestLng, 30)
          dashedRef.current = L.polyline(redPoints, dashedStyle).addTo(map)
        }
      } else {
        // === NORMAL ROUTE: standard polylines ===
        routeRef.current = L.polyline(
          [[startLat, startLng], [cLat, cLng]], solidStyle
        ).addTo(map)

        if (destinationLat != null && destinationLng != null) {
          dashedRef.current = L.polyline(
            [[cLat, cLng], [destinationLat, destinationLng]], dashedStyle
          ).addTo(map)
        }

        // Fit bounds for non-AM routes
        if (startLat != null && startLng != null && destinationLat != null && destinationLng != null) {
          const allLats = [startLat, destinationLat]
          const allLngs = [startLng, destinationLng]
          if (currentLat != null) allLats.push(currentLat)
          if (currentLng != null) allLngs.push(currentLng)
          map.fitBounds(L.latLngBounds(
            [Math.min(...allLats) - 5, Math.min(...allLngs) - 5],
            [Math.max(...allLats) + 5, Math.max(...allLngs) + 5],
          ), { padding: [30, 30] })
        }
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove() } catch (e) {}
      }
      mapInstanceRef.current = null
    }
  }, [])

  // ── Update helpers ──
  const updateBlueRoute = (toLat, toLng) => {
    if (!routeRef.current) return
    if (routeCrossesAM) {
      const pts = bezierWaypoints(startLat, startLng, toLat, toLng, 40)
      routeRef.current.setLatLngs(pts)
    } else {
      routeRef.current.setLatLngs([[startLat, startLng], [toLat, toLng]])
    }
  }

  const updateRedRoute = (fromLat, fromLng, toLat, toLng) => {
    if (!dashedRef.current) return
    if (routeCrossesAM) {
      const pts = bezierWaypoints(fromLat, fromLng, toLat, toLng, 30)
      dashedRef.current.setLatLngs(pts)
    } else {
      dashedRef.current.setLatLngs([[fromLat, fromLng], [toLat, toLng]])
    }
  }

  const clearDashed = () => {
    const map = mapInstanceRef.current
    if (dashedRef.current && map) {
      try { map.removeLayer(dashedRef.current) } catch (e) {}
      dashedRef.current = null
    }
  }

  // ── Animation ──
  const animateMarker = (marker, fromLatLng, toLatLng, duration = 2000) => {
    const startTime = performance.now()
    if (animationRef.current) cancelAnimationFrame(animationRef.current)

    const fromLng = fromLatLng.lng
    const toLngAdj = routeCrossesAM ? adjustLng(startLng, toLatLng.lng) : toLatLng.lng

    const animate = (time) => {
      const raw = Math.min((time - startTime) / duration, 1)
      const progress = easeOut(raw)
      const aLat = fromLatLng.lat + (toLatLng.lat - fromLatLng.lat) * progress
      const aLng = fromLng + (toLngAdj - fromLng) * progress

      marker.setLatLng([aLat, aLng])
      updateBlueRoute(aLat, aLng)

      if (raw < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        animationRef.current = null
      }
    }
    animationRef.current = requestAnimationFrame(animate)
  }

  // ── React to coordinate / status changes ──
  useEffect(() => {
    const marker = markerRef.current
    const map = mapInstanceRef.current
    if (!marker || currentLat === null || currentLng === null || !map) return

    const curLng = routeCrossesAM ? adjCurrentLng : currentLng
    const dLng = routeCrossesAM ? adjDestLng : destinationLng
    const isMoving = status === 'In Transit'
    const prevStatus = prevStatusRef.current

    // Ship just stopped
    if (prevStatus === 'In Transit' && !isMoving) {
      const from = marker.getLatLng()
      animateMarker(marker, from, L.latLng(currentLat, curLng), 1200)

      setTimeout(() => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        marker.setLatLng([currentLat, curLng])
        updateBlueRoute(currentLat, curLng)
        if (destinationLat && dLng) {
          updateRedRoute(currentLat, curLng, destinationLat, dLng)
        }
        if (status === 'Delivered') {
          map.flyTo([currentLat, curLng], 10, { duration: 1.2 })
        }
      }, 1250)

      prevStatusRef.current = status
      return
    }

    // Not moving
    if (!isMoving) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      marker.setLatLng([currentLat, curLng])
      updateBlueRoute(currentLat, curLng)
      if (destinationLat && dLng) {
        updateRedRoute(currentLat, curLng, destinationLat, dLng)
      }

      if (status === 'Delivered') {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([currentLat, curLng], 10, { duration: 1.2 })
          }
        }, 600)
      }

      prevStatusRef.current = status
      return
    }

    // In Transit
    const from = marker.getLatLng()
    animateMarker(marker, from, L.latLng(currentLat, curLng), 8000)
    updateBlueRoute(currentLat, curLng)
    if (destinationLat && dLng) {
      updateRedRoute(currentLat, curLng, destinationLat, dLng)
    }

    prevStatusRef.current = status
  }, [currentLat, currentLng, status, startLat, startLng, destinationLat, destinationLng])

  return <div ref={mapRef} style={{ height: '500px', width: '100%', borderRadius: '0 0 12px 12px' }} />
}
