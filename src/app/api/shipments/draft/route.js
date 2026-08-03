// src/app/api/shipments/draft/route.js
//
// Cross-device draft persistence for the "Create Shipment" admin form.
// One draft row per admin user (keyed by their Supabase auth user id).
import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseClient'

// GET: fetch the current admin's saved draft (if any)
export async function GET(req) {
  try {
    const authResult = await requireAdminUser(req)
    if (authResult.response) return authResult.response
    const { user } = authResult

    const { data, error } = await supabaseAdmin
      .from('admin_shipment_drafts')
      .select('draft_data, updated_at')
      .eq('admin_user_id', user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json(data || null)
  } catch (err) {
    console.error('Fetch draft error:', err)
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 })
  }
}

// PUT: save/overwrite the current admin's draft
export async function PUT(req) {
  try {
    const authResult = await requireAdminUser(req)
    if (authResult.response) return authResult.response
    const { user } = authResult

    const body = await req.json()

    const { error } = await supabaseAdmin
      .from('admin_shipment_drafts')
      .upsert(
        {
          admin_user_id: user.id,
          draft_data: body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'admin_user_id' }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Save draft error:', err)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}

// DELETE: clear the current admin's draft (called after a shipment is created,
// or when the admin explicitly discards the draft)
export async function DELETE(req) {
  try {
    const authResult = await requireAdminUser(req)
    if (authResult.response) return authResult.response
    const { user } = authResult

    const { error } = await supabaseAdmin
      .from('admin_shipment_drafts')
      .delete()
      .eq('admin_user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete draft error:', err)
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
  }
}
