import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    const { shipmentCode, index, field, value } = await req.json();
    if (!shipmentCode || index === undefined || !field) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Fetch shipment
    const { data: shipment, error } = await supabaseAdmin
      .from('shipments')
      .select('products')
      .eq('code', shipmentCode.toUpperCase())
      .single();
    if (error) throw error;

    const products = shipment.products || [];
    if (!products[index]) return NextResponse.json({ error: 'Product index out of bounds' }, { status: 400 });

    products[index][field] = value;

    const { error: updateError } = await supabaseAdmin
      .from('shipments')
      .update({ products, updated_at: new Date().toISOString() })
      .eq('code', shipmentCode.toUpperCase());
    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update product error:', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
