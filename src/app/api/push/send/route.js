// src/app/api/push/send/route.js
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabaseAdmin } from '@/lib/supabaseClient';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const rawEmail = process.env.VAPID_EMAIL || 'mailto:admin@shiptrackglobal.com';
const VAPID_EMAIL = rawEmail.startsWith('mailto:') ? rawEmail : `mailto:${rawEmail}`;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function POST(req) {
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { title, message, url, secret } = body;

    // Simple internal secret check (not admin auth — this is called server-to-server)
    if (secret !== process.env.PUSH_INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: subs, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, subscription');

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscribers' });
    }

    const payload = JSON.stringify({
      title: title || 'ShipTrack Global',
      body: message || 'New visitor on your site',
      url: url || '/admin/dashboard',
      tag: 'visitor-' + Date.now(),
    });

    const results = await Promise.allSettled(
      subs.map(async (row) => {
        const sub = JSON.parse(row.subscription);
        try {
          await webpush.sendNotification(sub, payload);
        } catch (err) {
          // If subscription is expired/invalid, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', row.endpoint);
          }
          throw err;
        }
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return NextResponse.json({ sent, total: subs.length });
  } catch (err) {
    console.error('Push send error:', err);
    return NextResponse.json({ error: 'Failed to send push' }, { status: 500 });
  }
}
