// src/app/api/telegram/setup/route.js
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseClient';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// POST — add a new chat_id subscription
export async function POST(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
    }

    const { chat_id, label } = await req.json();
    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 });
    }

    const chatIdStr = String(chat_id).trim();

    // Test by sending a welcome message
    const testRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatIdStr,
          text: `✅ <b>ShipTrack Global connected!</b>\n\nYou will now receive visitor notifications here.\n\n👤 Account: ${label || 'Admin'}`,
          parse_mode: 'HTML',
        }),
      }
    );

    const testData = await testRes.json();
    if (!testData.ok) {
      return NextResponse.json(
        { error: 'Could not send message. Make sure you sent /start to the bot first.' },
        { status: 400 }
      );
    }

    // Upsert into telegram_subscriptions — one row per chat_id
    const { error } = await supabaseAdmin
      .from('telegram_subscriptions')
      .upsert(
        {
          chat_id: chatIdStr,
          label: label || 'Admin',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'chat_id' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Telegram setup error:', err);
    return NextResponse.json({ error: 'Failed to save Telegram subscription' }, { status: 500 });
  }
}

// DELETE — remove a specific chat_id
export async function DELETE(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    const { chat_id } = await req.json();
    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('telegram_subscriptions')
      .delete()
      .eq('chat_id', String(chat_id));

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Telegram remove error:', err);
    return NextResponse.json({ error: 'Failed to remove Telegram subscription' }, { status: 500 });
  }
}

// GET — list all connected chat IDs
export async function GET(req) {
  try {
    const authResult = await requireAdminUser(req);
    if (authResult.response) return authResult.response;

    const { data, error } = await supabaseAdmin
      .from('telegram_subscriptions')
      .select('chat_id, label, updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      connected: (data?.length || 0) > 0,
      subscribers: data || [],
    });
  } catch {
    return NextResponse.json({ connected: false, subscribers: [] });
  }
}
