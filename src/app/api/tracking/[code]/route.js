// src/app/api/tracking/[code]/route.js
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { sendAdminCommentEmail } from '@/lib/email';

const safeParseFloat = (val) =>
  val === null || val === undefined || val === '' ? 0 : parseFloat(val);

// GET: fetch shipment data
export async function GET(request, { params }) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: 'Missing tracking code' }, { status: 400 });
    }

    const { data: shipment, error } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !shipment) {
      return NextResponse.json({ error: 'Tracking code not found' }, { status: 404 });
    }

    // Parse products
    if (shipment.products && typeof shipment.products === 'string') {
      try {
        shipment.products = JSON.parse(shipment.products);
      } catch {
        shipment.products = [];
      }
    } else if (!shipment.products) {
      shipment.products = [];
    }

    // Calculate progress & location
    const startLat = safeParseFloat(shipment.current_lat);
    const startLng = safeParseFloat(shipment.current_lng);
    const destLat = safeParseFloat(shipment.dest_lat);
    const destLng = safeParseFloat(shipment.dest_lng);
    const estimatedHours = shipment.estimated_hours || 0;
    const createdAt = new Date(shipment.created_at);

    let simulatedProgress = shipment.progress ?? 0;
    if (estimatedHours > 0) {
      const elapsed = Date.now() - createdAt.getTime();
      simulatedProgress = Math.max(0, Math.min(1, elapsed / (estimatedHours * 3600 * 1000)));
    }

    const currentLat = startLat + simulatedProgress * (destLat - startLat);
    const currentLng = startLng + simulatedProgress * (destLng - startLng);

    let finalStatus = shipment.status;
    if (!['Delivered', 'Cancelled', 'On Hold'].includes(finalStatus)) {
      finalStatus = simulatedProgress >= 1 ? 'Delivered' : 'In Transit';
    }

    // Background update
    if (
      simulatedProgress !== shipment.progress ||
      currentLat !== shipment.current_lat ||
      currentLng !== shipment.current_lng ||
      finalStatus !== shipment.status
    ) {
      (async () => {
        const { error: updateError } = await supabaseAdmin
          .from('shipments')
          .update({
            progress: simulatedProgress,
            current_lat: currentLat,
            current_lng: currentLng,
            status: finalStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shipment.id);

        if (updateError) console.error('Error updating shipment progress in background:', updateError);
      })();
    }

    return NextResponse.json({
      ...shipment,
      progress: simulatedProgress,
      current_lat: currentLat,
      current_lng: currentLng,
      dest_lat: destLat,
      dest_lng: destLng,
      status: finalStatus,
    });
  } catch (err) {
    console.error('Error fetching tracking data:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: update shipment data (status, location, progress, admin_comment)
export async function PATCH(request, { params }) {
  try {
    const authResult = await requireAdminUser(request);
    if (authResult.response) return authResult.response;

    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: 'Missing tracking code' }, { status: 400 });
    }

    const body = await request.json();
    const updateData = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.current_lat !== undefined) updateData.current_lat = parseFloat(body.current_lat);
    if (body.current_lng !== undefined) updateData.current_lng = parseFloat(body.current_lng);
    if (body.progress !== undefined) updateData.progress = parseFloat(body.progress);
    if (body.admin_comment !== undefined) updateData.admin_comment = body.admin_comment?.trim() || null;

    // Fetch shipment first to get its ID
    const { data: shipment, error: fetchError } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError || !shipment) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    if (!shipment.id) {
      console.error('Shipment ID is missing, cannot update');
      return NextResponse.json({ error: 'Shipment ID missing' }, { status: 400 });
    }

    // Build update payload dynamically
    const updatePayload = { updated_at: new Date().toISOString() };
    for (const key in updateData) {
      if (updateData[key] !== undefined) updatePayload[key] = updateData[key];
    }

    console.log('Updating shipment with payload:', updatePayload);

    // 🔥 FIX: Update by ID (primary key), not by code
    const { data: updatedShipment, error: updateError } = await supabaseAdmin
      .from('shipments')
      .update(updatePayload)
      .eq('id', shipment.id)  // ✅ Changed from .eq('code', code)
      .select()
      .single();  // ✅ Changed from .maybeSingle() to .single() since we know it exists

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json({ error: updateError.message || 'Failed to update shipment' }, { status: 500 });
    }

    console.log('Successfully updated shipment:', updatedShipment);

    // Send admin comment email if changed
    if (
      updateData.admin_comment &&
      updateData.admin_comment !== shipment.admin_comment &&
      shipment.receiver_email
    ) {
      try {
        await sendAdminCommentEmail(shipment.receiver_email, code, updateData.admin_comment);
        console.log(`Admin comment email sent to ${shipment.receiver_email}`);
      } catch (err) {
        console.error('Failed to send admin comment email:', err);
      }
    }

    return NextResponse.json(updatedShipment);
  } catch (err) {
    console.error('Error updating shipment:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
