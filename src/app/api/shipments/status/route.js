import { NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/adminAuth'
import { supabaseAdmin } from '@/lib/supabaseClient'

export async function PUT(req) {
  try {
    const authResult = await requireAdminUser(req)
    if (authResult.response) return authResult.response

    const { code, status } = await req.json()

    if (!code || !status) {
      return NextResponse.json(
        { error: 'Missing code or status' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('shipments')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('code', code)

    if (error) throw error

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Status updated successfully',
      status
    })
  } catch (err) {
    console.error('Error updating status:', err)
    return NextResponse.json(
      { error: 'Failed to update status', details: err.message },
      { status: 500 }
    )
  }
}

// ⬇️ Required to avoid 405 Method Not Allowed
export function GET() {
  return NextResponse.json({ message: "Status endpoint live" })
}
