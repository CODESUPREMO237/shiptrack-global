import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    const { shipmentCode } = await req.json();
    if (!shipmentCode) return NextResponse.json({ error: 'Shipment code required' }, { status: 400 });

    const { data: shipment, error } = await supabaseAdmin
      .from('shipments')
      .select('products')
      .eq('code', shipmentCode.toUpperCase())
      .single();
    if (error) throw error;

    const products = shipment.products || [];
    products.push({ piece_type: "", description: "", qty: 1, weight_kg: 0 });

    const { error: updateError } = await supabaseAdmin
      .from('shipments')
      .update({ products, updated_at: new Date().toISOString() })
      .eq('code', shipmentCode.toUpperCase());
    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Add product error:', err);
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}
