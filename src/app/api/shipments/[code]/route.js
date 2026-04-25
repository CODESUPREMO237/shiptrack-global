// src/app/api/shipments/[code]/route.js
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function PATCH(req, { params }) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    const resolvedParams = await params;
    const { code } = resolvedParams;

    if (!code) return NextResponse.json({ error: 'Shipment code is required' }, { status: 400 });

    const body = await req.json();

    const allowedShipmentFields = [
      'name', 'agency', 'status', 'shipment_type', 'shipment_mode',
      'payment_mode', 'carrier_ref', 'current_lat', 'current_lng',
      'dest_lat', 'dest_lng', 'estimated_hours',
      // Pricing & Finance
      'total_cost', 'currency', 'payment_status', 'declared_value', 'tax_amount', 'insurance_value',
      // Shipper & Receiver
      'shipper_name', 'shipper_address', 'shipper_phone',
      'receiver_name', 'receiver_address', 'receiver_phone', 'receiver_email',
      // Origin & Destination
      'originCity', 'destCity',
      // Dates
      'pickup_datetime', 'expected_delivery_datetime', 'delivery_datetime',
      // Progress
      'progress',
    ];

    const payload = {};

    // Copy only allowed fields
    allowedShipmentFields.forEach(f => {
      if (body[f] !== undefined) payload[f] = body[f];
    });

    // Validate status
    const validStatuses = ["On Hold", "In Transit", "Delivered", "Cancelled"];
    if (payload.status && !validStatuses.includes(payload.status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle products array
    if (body.products) {
      payload.products = body.products.map(p => ({
        piece_type: p.piece_type || '',
        description: p.description || '',
        qty: p.qty ?? 1,
        length_cm: p.length_cm ?? null,
        width_cm: p.width_cm ?? null,
        height_cm: p.height_cm ?? null,
        weight_kg: p.weight_kg ?? null,
      }));
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ message: 'No fields to update' });
    }

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('shipments')
      .update(payload)
      .eq('code', code.toUpperCase());

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Patch shipment error:', err);
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}
