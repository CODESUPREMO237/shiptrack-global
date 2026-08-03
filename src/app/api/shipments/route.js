// src/app/api/shipments/route.js
import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function POST(req) {
  try {
    const authResult = await requireAdminUser(req)
    if (authResult.response) return authResult.response

    const data = await req.json()

    const code = 'SHP' + Math.random().toString(36).substring(2, 8).toUpperCase()

    // Ensure products is always an array with proper default fields
    const products = Array.isArray(data.products)
      ? data.products.map((p) => ({
          piece_type: p.piece_type || '',
            product: p.product || '',
          description: p.description || '',
          qty: p.qty ?? 1,
          length_cm: p.length_cm ?? 0,
          width_cm: p.width_cm ?? 0,
          height_cm: p.height_cm ?? 0,
          weight_kg: p.weight_kg ?? 0,
        }))
      : []

    // Calculate weights
    const totalWeight = products.reduce((sum, p) => 
      sum + (parseFloat(p.weight_kg) || 0) * (parseInt(p.qty) || 1), 0
    )
    
    const volumetricWeight = products.reduce((sum, p) => {
      const vol = (parseFloat(p.length_cm) || 0) * 
                  (parseFloat(p.width_cm) || 0) * 
                  (parseFloat(p.height_cm) || 0)
      return sum + (vol / 5000) * (parseInt(p.qty) || 1)
    }, 0)

    // Auto-apply business rules
    const declaredValue = parseFloat(data.declared_value) || 0
    const requiresInsurance = declaredValue > 5
    
    if (requiresInsurance && !data.insurance) {
      return NextResponse.json({ 
        error: 'Insurance is required for shipments with declared value over $5',
        field: 'insurance'
      }, { status: 400 })
    }

    // Check if international
    const originCountry = data.originCity?.split(', ').pop()
    const destCountry = data.destCity?.split(', ').pop()
    const isInternational = originCountry && destCountry && originCountry !== destCountry

    if (isInternational && (!data.hs_code || !data.incoterm)) {
      return NextResponse.json({ 
        error: 'HS Code and Incoterm are required for international shipments',
        field: isInternational ? 'hs_code' : 'incoterm'
      }, { status: 400 })
    }

    // Initialize tracking history
    const trackingHistory = data.tracking_history || [{
      event: 'Shipment Created',
      location: data.location || data.originCity || 'Origin',
      timestamp: new Date().toISOString(),
      reason: data.reason_for_status_change || 'Initial shipment creation',
      status: data.status || 'In Transit'
    }]

    // Build comprehensive payload with all new fields
    const payload = {
      code,
      
      // Basic Info
      name: data.name || '',
      agency: data.agency || '',
      
      // Products (JSONB column)
      products, 
      
      // Client Context
      client_id: data.client_id || null,
      
      // Finance & Pricing
      total_cost: data.total_cost ? parseFloat(data.total_cost) : null,
      currency: data.currency || 'USD',
      payment_status: data.payment_status || 'Pending',
      tax_amount: data.tax_amount ? parseFloat(data.tax_amount) : null,
      insurance: data.insurance || false,
      insurance_value: data.insurance_value ? parseFloat(data.insurance_value) : null,
      declared_value: declaredValue,
      
      // Shipper/Receiver
      shipper_name: data.shipper_name || '',
      shipper_address: data.shipper_address || '',
      shipper_phone: data.shipper_phone || null,
      receiver_name: data.receiver_name || '',
      receiver_address: data.receiver_address || '',
      receiver_phone: data.receiver_phone || null,
      receiver_email: data.receiver_email || null,
      
      // Coordinates
      origin_lat: data.origin_lat ? parseFloat(data.origin_lat) : null,
      origin_lng: data.origin_lng ? parseFloat(data.origin_lng) : null,
      current_lat: data.current_lat ? parseFloat(data.current_lat) : data.origin_lat ? parseFloat(data.origin_lat) : null,
      current_lng: data.current_lng ? parseFloat(data.current_lng) : data.origin_lng ? parseFloat(data.origin_lng) : null,
      dest_lat: data.dest_lat ? parseFloat(data.dest_lat) : null,
      dest_lng: data.dest_lng ? parseFloat(data.dest_lng) : null,

      // Origin & Destination (city names — previously only coordinates were saved here)
      origin_city: data.originCity || null,
      dest_city: data.destCity || null,
      
      // Tracking & Delivery
      pickup_datetime: data.pickup_datetime || null,
      expected_delivery_datetime: data.expected_delivery_datetime || null,
       
      delivery_datetime: data.delivery_datetime || null,
      tracking_history: trackingHistory,
      current_vehicle_id: data.current_vehicle_id || null,
      current_driver_id: data.current_driver_id || null,
      transit_hubs: data.transit_hubs || [],
      delivery_signature_required: data.delivery_signature_required || false,
      
      // Weight & Category
      total_weight: totalWeight.toFixed(2),
      volumetric_weight: volumetricWeight.toFixed(2),
      shipment_category: data.shipment_category || 'General',
      special_handling: Array.isArray(data.special_handling) ? data.special_handling : [],
      
      // Customs (for international)
      hs_code: data.hs_code || null,
      country_of_manufacture: data.country_of_manufacture || null,
      customs_docs: data.customs_docs || [],
      customs_declaration_description: data.customs_declaration_description || null,
      incoterm: data.incoterm || null,
      
      // Status
      reason_for_status_change: data.reason_for_status_change || 'Initial creation',
      estimated_hours: data.estimated_hours ? parseInt(data.estimated_hours, 10) : null,
      progress: 0,
      status: data.status || 'In Transit',
      
      // Transaction Details
      shipment_type: data.shipment_type || 'Truckload',
      shipment_mode: data.shipment_mode || 'Land Shipping',
      payment_mode: data.payment_mode || 'PAYPAL',
      carrier_ref: data.carrier_ref || `LOG${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      location: data.location || '',
      
      // Admin
      admin_comment: data.admin_comment || null,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('Creating shipment with enhanced payload:', {
      code: payload.code,
      weights: { total: payload.total_weight, volumetric: payload.volumetric_weight },
      insurance: payload.insurance,
      international: isInternational,
      coordinates: {
        origin: { lat: payload.origin_lat, lng: payload.origin_lng },
        current: { lat: payload.current_lat, lng: payload.current_lng },
        dest: { lat: payload.dest_lat, lng: payload.dest_lng },
      }
    })

    const { error } = await supabaseAdmin.from('shipments').insert([payload])
    
    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }

    return NextResponse.json({ 
      code, 
      message: 'Shipment created successfully',
      summary: {
        totalWeight: payload.total_weight,
        volumetricWeight: payload.volumetric_weight,
        chargeableWeight: Math.max(parseFloat(payload.total_weight), parseFloat(payload.volumetric_weight)).toFixed(2),
        requiresInsurance: requiresInsurance,
        isInternational: isInternational,
        pieces: products.reduce((sum, p) => sum + (parseInt(p.qty) || 0), 0)
      }
    })
  } catch (err) {
    console.error('Create shipment error:', err)
    return NextResponse.json({ 
      error: 'Failed to create shipment',
      details: err.message 
    }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    const authResult = await requireAdminUser(req)
    if (authResult.response) return authResult.response

    const { data, error } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('Fetch shipments error:', err)
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 })
  }
}
