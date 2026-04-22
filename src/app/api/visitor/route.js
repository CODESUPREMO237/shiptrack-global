// src/app/api/visitor/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN) return;
  if (!supabaseAdmin) return;

  try {
    const { data } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'telegram_chat_id')
      .single();

    const chatId = data?.value;
    if (!chatId) return;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Telegram notify error:', err);
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
    const shortRef = referrer ? ` · from: ${referrer}` : '';

    const telegramMsg =
      `👁️ <b>New Visitor — ShipTrack</b>\n` +
      `📍 Page: <code>${pageLabel}</code>\n` +
      `🌐 IP: <code>${ip}</code>\n` +
      `📱 ${shortUA}${shortRef}`;

    const pushMessage = `${pageLabel} · ${ip} · ${shortUA}`;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const secret = process.env.PUSH_INTERNAL_SECRET;

    // Fire both simultaneously — neither blocks the visitor response
    Promise.all([
      sendTelegram(telegramMsg),
      sendWebPush('👁️ New Visitor — ShipTrack', pushMessage, baseUrl, secret),
    ]).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Visitor track error:', err);
    return NextResponse.json({ ok: false });
  }
}
