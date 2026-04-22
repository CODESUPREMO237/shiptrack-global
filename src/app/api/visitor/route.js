// src/app/api/visitor/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramToAll(message) {
  if (!TELEGRAM_BOT_TOKEN || !supabaseAdmin) return;

  try {
    const { data: subs } = await supabaseAdmin
      .from('telegram_subscriptions')
      .select('chat_id');

    if (!subs || subs.length === 0) return;

    // Send to all subscribers in parallel
    await Promise.allSettled(
      subs.map((row) =>
        fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: row.chat_id,
            text: message,
            parse_mode: 'HTML',
          }),
        })
      )
    );
  } catch (err) {
    console.error('Telegram broadcast error:', err);
  }
}

async function sendWebPush(title, message, baseUrl, secret) {
  if (!secret) return;
  try {
    await fetch(`${baseUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        title,
        message,
        url: '/admin/dashboard',
      }),
    });
  } catch (err) {
    console.error('Web push notify error:', err);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { page, referrer } = body;

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const ua = req.headers.get('user-agent') || 'unknown';

    // Skip bot/crawler traffic
    if (/bot|crawl|spider|slurp|facebookexternalhit|WhatsApp|Googlebot/i.test(ua)) {
      return NextResponse.json({ ok: true });
    }

    const pageLabel = page || '/';
    const shortUA = ua.length > 80 ? ua.slice(0, 77) + '…' : ua;
    const refLine = referrer ? `\n🔗 From: <code>${referrer}</code>` : '';

    const telegramMsg =
      `👁️ <b>New Visitor — ShipTrack</b>\n` +
      `📍 Page: <code>${pageLabel}</code>\n` +
      `🌐 IP: <code>${ip}</code>\n` +
      `📱 ${shortUA}${refLine}`;

    const pushMessage = `${pageLabel} · ${ip} · ${shortUA}`;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const secret = process.env.PUSH_INTERNAL_SECRET;

    // Fire both simultaneously — fire and forget
    Promise.all([
      sendTelegramToAll(telegramMsg),
      sendWebPush('👁️ New Visitor — ShipTrack', pushMessage, baseUrl, secret),
    ]).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Visitor track error:', err);
    return NextResponse.json({ ok: false });
  }
}
