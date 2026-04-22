// src/app/api/telegram/setup/route.js
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseClient';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// GET — verify a code the admin just sent to the bot, return their chat_id
export async function POST(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
    }

    const { chat_id } = await req.json();
    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 });
    }

    // Test: send a welcome message to confirm it works
    const testRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id,
          text: '✅ ShipTrack Global connected! You will now receive visitor notifications here.',
          parse_mode: 'HTML',
        }),
      }
    );

    const testData = await testRes.json();
    if (!testData.ok) {
      return NextResponse.json(
        { error: 'Could not send message. Make sure you started the bot first.' },
        { status: 400 }
      );
    }

    // Save chat_id to supabase — upsert keyed by a fixed admin row
    const { error } = await supabaseAdmin
      .from('admin_settings')
      .upsert({ key: 'telegram_chat_id', value: String(chat_id), updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Telegram setup error:', err);
    return NextResponse.json({ error: 'Failed to save Telegram chat ID' }, { status: 500 });
  }
}

// DELETE — remove Telegram notifications
export async function DELETE(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    await supabaseAdmin.from('admin_settings').delete().eq('key', 'telegram_chat_id');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Telegram remove error:', err);
    return NextResponse.json({ error: 'Failed to remove Telegram' }, { status: 500 });
  }
}

// GET — check if telegram is configured
export async function GET(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    const { data } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'telegram_chat_id')
      .single();

    return NextResponse.json({ connected: !!data?.value, chat_id: data?.value || null });
  } catch {
    return NextResponse.json({ connected: false, chat_id: null });
  }
}
