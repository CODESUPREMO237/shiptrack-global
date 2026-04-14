// src/app/api/update-location/route.js
import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function POST(req) {
  try {
    const authResult = await requireAdminUser(req)
    if (authResult.response) return authResult.response

    const { code, lat, lng } = await req.json()
    const { data, error } = await supabaseAdmin
      .from('shipments')
      .update({
        current_lat: lat,
        current_lng: lng,
        updated_at: new Date().toISOString(),
      })
      .eq('code', code.toUpperCase())

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update location error:', err)
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}
