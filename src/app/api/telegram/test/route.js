// src/app/api/telegram/test/route.js
// Temporary test endpoint to debug Telegram notification delivery
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET() {
  const diagnostics = {
    hasBotToken: !!TELEGRAM_BOT_TOKEN,
    botTokenPrefix: TELEGRAM_BOT_TOKEN ? TELEGRAM_BOT_TOKEN.substring(0, 10) + '...' : null,
    hasSupabaseAdmin: !!supabaseAdmin,
    subscribers: [],
    sendResults: [],
  };

  try {
    // 1. Check subscribers
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('telegram_subscriptions')
      .select('chat_id, label');

    if (subsErr) {
      diagnostics.subscriberError = subsErr.message;
      return NextResponse.json(diagnostics);
    }

    diagnostics.subscribers = subs || [];

    if (!subs || subs.length === 0) {
      diagnostics.note = 'No subscribers found in telegram_subscriptions table';
      return NextResponse.json(diagnostics);
    }

    // 2. Try sending a simple test message (no HTML)
    for (const row of subs) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: row.chat_id,
            text: `✅ ShipTrack Telegram Test\n\nThis is a test message to verify notifications are working.\nTimestamp: ${new Date().toISOString()}`,
          }),
        });
        const data = await res.json();
        diagnostics.sendResults.push({
          chat_id: row.chat_id,
          label: row.label,
          success: data.ok,
          error: data.ok ? null : data.description,
        });
      } catch (err) {
        diagnostics.sendResults.push({
          chat_id: row.chat_id,
          label: row.label,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json(diagnostics);
  } catch (err) {
    diagnostics.error = err.message;
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
