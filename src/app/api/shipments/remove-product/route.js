import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    const { shipmentCode, index } = await req.json();
    if (!shipmentCode || index === undefined) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    let selectRes = await supabaseAdmin
      .from('shipments')
      .select('products, owner_id')
      .eq('code', shipmentCode.toUpperCase())
      .single();
    if (selectRes.error && selectRes.error.code === '42703') {
      selectRes = await supabaseAdmin
        .from('shipments')
        .select('products')
        .eq('code', shipmentCode.toUpperCase())
        .single();
    }
    if (selectRes.error) throw selectRes.error;
    const shipment = selectRes.data;
    if (!shipment || (shipment.owner_id && shipment.owner_id !== authResult.user.id)) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    const products = shipment.products || [];
    if (!products[index]) return NextResponse.json({ error: 'Product index out of bounds' }, { status: 400 });

    products.splice(index, 1);

    const { error: updateError } = await supabaseAdmin
      .from('shipments')
      .update({ products, updated_at: new Date().toISOString() })
      .eq('code', shipmentCode.toUpperCase());
    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Remove product error:', err);
    return NextResponse.json({ error: 'Failed to remove product' }, { status: 500 });
  }
}
