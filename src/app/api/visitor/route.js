// src/app/api/visitor/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { page, referrer } = body;

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const ua = req.headers.get('user-agent') || 'unknown';

    // Build a readable message
    const pageLabel = page || '/';
    const shortUA = ua.length > 60 ? ua.slice(0, 57) + '…' : ua;
    const message = `📍 ${pageLabel} · ${ip} · ${shortUA}`;

    // Fire the push notification — internal call with secret
    const secret = process.env.PUSH_INTERNAL_SECRET;
    if (!secret) {
      // No secret configured — skip silently
      return NextResponse.json({ ok: true });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Fire and forget — don't block the visitor response
    fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        title: '👁️ New Visitor — ShipTrack',
        message,
        url: '/admin/dashboard',
      }),
    }).catch(() => {}); // silent fail — visitor shouldn't care

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Visitor track error:', err);
    return NextResponse.json({ ok: false });
  }
}
