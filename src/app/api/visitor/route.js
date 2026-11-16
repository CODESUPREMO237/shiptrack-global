// src/app/api/visitor/route.js
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import nodemailer from 'nodemailer';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Email rate-limiting: send at most 1 visitor email per 30 minutes
const EMAIL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
let lastEmailSentAt = 0;

// Escape for Telegram HTML parse_mode
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Parse user agent into human-readable device/browser/OS
function parseUA(ua) {
  // Device type
  let device = '🖥️ Desktop';
  if (/iphone/i.test(ua)) device = '📱 iPhone';
  else if (/ipad/i.test(ua)) device = '📱 iPad';
  else if (/android.*mobile/i.test(ua)) device = '📱 Android Phone';
  else if (/android/i.test(ua)) device = '📱 Android Tablet';
  else if (/macintosh/i.test(ua)) device = '💻 Mac';
  else if (/windows/i.test(ua)) device = '🖥️ Windows PC';
  else if (/linux/i.test(ua)) device = '🖥️ Linux';

  // OS
  let os = '';
  if (/iphone os ([\d_]+)/i.test(ua)) os = 'iOS ' + ua.match(/iphone os ([\d_]+)/i)[1].replace(/_/g, '.');
  else if (/ipad.*os ([\d_]+)/i.test(ua)) os = 'iPadOS ' + ua.match(/os ([\d_]+)/i)[1].replace(/_/g, '.');
  else if (/android ([\d.]+)/i.test(ua)) os = 'Android ' + ua.match(/android ([\d.]+)/i)[1];
  else if (/windows nt ([\d.]+)/i.test(ua)) {
    const v = ua.match(/windows nt ([\d.]+)/i)[1];
    const map = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' };
    os = 'Windows ' + (map[v] || v);
  } else if (/mac os x ([\d_]+)/i.test(ua)) os = 'macOS ' + ua.match(/mac os x ([\d_]+)/i)[1].replace(/_/g, '.');

  // Browser
  let browser = '';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\//i.test(ua)) browser = 'Opera';
  else if (/chrome\/([\d.]+)/i.test(ua)) browser = 'Chrome ' + ua.match(/chrome\/([\d.]+)/i)[1].split('.')[0];
  else if (/firefox\/([\d.]+)/i.test(ua)) browser = 'Firefox ' + ua.match(/firefox\/([\d.]+)/i)[1].split('.')[0];
  else if (/safari\/([\d.]+)/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Browser';

  return { device, os, browser };
}

// Get geo info from ip-api.com (free, no key needed)
async function getGeoInfo(ip) {
  try {
    if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return null;
    }
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org`,
      { signal: AbortSignal.timeout(3000) }
    );
    const data = await res.json();
    if (data.status !== 'success') return null;
    return data;
  } catch {
    return null;
  }
}

async function sendTelegramToAll(message) {
  if (!TELEGRAM_BOT_TOKEN || !supabaseAdmin) return;
  try {
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('telegram_subscriptions')
      .select('chat_id');
    if (subsErr) {
      console.error('Telegram: failed to fetch subscribers:', subsErr);
      return;
    }
    if (!subs || subs.length === 0) {
      console.log('Telegram: no subscribers found');
      return;
    }
    console.log(`Telegram: sending to ${subs.length} subscriber(s)`);
    const results = await Promise.allSettled(
      subs.map(async (row) => {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: row.chat_id, text: message, parse_mode: 'HTML' }),
        });
        const data = await res.json();
        if (!data.ok) {
          console.error(`Telegram send failed for chat_id ${row.chat_id}:`, data.description);
        }
        return data;
      })
    );
    console.log('Telegram results:', results.map(r => r.status));
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
      body: JSON.stringify({ secret, title, message, url: '/admin/dashboard' }),
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

    // Skip bots/crawlers
    if (/bot|crawl|spider|slurp|facebookexternalhit|WhatsApp|Googlebot|bingbot|yandex/i.test(ua)) {
      return NextResponse.json({ ok: true });
    }

    const pageLabel = page || '/';
    const { device, os, browser } = parseUA(ua);

    // Fetch geo in parallel with everything else
    const geo = await getGeoInfo(ip);

    // Build location string
    let locationLine = `🌐 IP: <code>${escHtml(ip)}</code>`;
    if (geo) {
      const flag = geo.countryCode
        ? [...geo.countryCode.toUpperCase()].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('')
        : '';
      const place = escHtml([geo.city, geo.regionName, geo.country].filter(Boolean).join(', '));
      const mapLink = geo.lat && geo.lon
        ? `\n🗺️ <a href="https://www.google.com/maps?q=${geo.lat},${geo.lon}">View on Map</a>`
        : '';
      locationLine =
        `🌍 ${flag} <b>${place}</b>${mapLink}\n` +
        `🌐 IP: <code>${escHtml(ip)}</code>\n` +
        `📡 ISP: ${escHtml(geo.isp || geo.org || 'unknown')}`;
    }

    const deviceLine = escHtml([device, os, browser].filter(Boolean).join(' · '));
    const refLine = referrer ? `\n🔗 From: <code>${escHtml(referrer)}</code>` : '';

    const telegramMsg =
      `👁️ <b>New Visitor — ShipTrack</b>\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📄 Page: <code>${escHtml(pageLabel)}</code>\n` +
      `${locationLine}\n` +
      `📱 ${deviceLine}` +
      `${refLine}`;

    const pushMessage = `${pageLabel} · ${geo ? geo.city + ', ' + geo.country : ip} · ${device}`;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const secret = process.env.PUSH_INTERNAL_SECRET;

    // Build email HTML
    const emailHtml = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="background:#111827;padding:20px 24px">
          <h2 style="color:#fff;margin:0;font-size:18px">👁️ New Visitor — ShipTrack Global</h2>
        </div>
        <div style="padding:24px;background:#f9fafb">
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151">
            <tr><td style="padding:8px 0;font-weight:600;width:120px">📄 Page</td><td>${pageLabel}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600">🌐 IP</td><td>${ip}</td></tr>
            ${geo ? `
            <tr><td style="padding:8px 0;font-weight:600">🌍 Location</td><td>${[geo.city, geo.regionName, geo.country].filter(Boolean).join(', ')}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600">📡 ISP</td><td>${geo.isp || geo.org || 'unknown'}</td></tr>
            ${geo.lat && geo.lon ? `<tr><td style="padding:8px 0;font-weight:600">🗺️ Map</td><td><a href="https://www.google.com/maps?q=${geo.lat},${geo.lon}" style="color:#4f46e5">View on Google Maps</a></td></tr>` : ''}
            ` : ''}
            <tr><td style="padding:8px 0;font-weight:600">📱 Device</td><td>${deviceLine}</td></tr>
            ${referrer ? `<tr><td style="padding:8px 0;font-weight:600">🔗 Referrer</td><td>${referrer}</td></tr>` : ''}
            <tr><td style="padding:8px 0;font-weight:600">🕐 Time</td><td>${new Date().toUTCString()}</td></tr>
          </table>
        </div>
        <div style="padding:12px 24px;background:#f3f4f6;font-size:12px;color:#9ca3af;text-align:center">
          ShipTrack Global — Visitor Alert
        </div>
      </div>
    `;

    async function sendVisitorEmail() {
      const now = Date.now();
      if (now - lastEmailSentAt < EMAIL_COOLDOWN_MS) {
        // Skip — already sent a visitor email recently
        return;
      }
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '465'),
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        await transporter.sendMail({
          from: `"ShipTrack Alerts" <${process.env.SMTP_USER}>`,
          to: process.env.SMTP_USER,
          subject: `👁️ New Visitor on ${pageLabel} — ShipTrack Global`,
          html: emailHtml,
        });
        lastEmailSentAt = now;
      } catch (err) {
        console.error('Visitor email error:', err);
      }
    }

    // Fire all three simultaneously — must await so the serverless function
    // doesn't terminate before Telegram / email finish sending
    await Promise.allSettled([
      sendTelegramToAll(telegramMsg),
      sendWebPush('👁️ New Visitor — ShipTrack', pushMessage, baseUrl, secret),
      sendVisitorEmail(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Visitor track error:', err);
    return NextResponse.json({ ok: false });
  }
}
