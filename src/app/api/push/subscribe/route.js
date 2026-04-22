// src/app/api/push/subscribe/route.js
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    const { subscription } = await req.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Upsert the subscription — one row keyed by endpoint
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: subscription.endpoint,
          subscription: JSON.stringify(subscription),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: 'No endpoint' }, { status: 400 });

    await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }
}
