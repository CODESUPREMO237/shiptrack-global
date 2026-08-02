// src/app/api/telegram/webhook/route.js
// This endpoint receives messages from the Telegram bot.
// Register it as your bot's webhook URL:
// https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://shiptrackglobal.com/api/telegram/webhook

import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const text = message.text?.trim() || '';
    const firstName = message.from?.first_name || 'there';

    if (text === '/start' || text.startsWith('/start')) {
      await sendMessage(
        chatId,
        `👋 Hello <b>${firstName}</b>!\n\n` +
        `Welcome to <b>ShipTrack Global</b> notifications bot.\n\n` +
        `Your Chat ID is:\n<code>${chatId}</code>\n\n` +
        `Copy this number and paste it into the <b>Connect Telegram</b> dialog in your admin dashboard to start receiving visitor notifications.`
      );
    } else {
      await sendMessage(chatId, `Send /start to get your Chat ID.`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: false });
  }
}
