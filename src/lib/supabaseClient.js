// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("❌ Missing NEXT_PUBLIC_SUPABASE_URL")
}

if (!supabasePublishableKey) {
  throw new Error("❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (Publishable key)")
}

// Public client (frontend-safe) - uses publishable key
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export const supabaseServerAuth = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Admin client (service role, can bypass RLS) - only for server-side
// This will be undefined in client-side code, which is fine
export const supabaseAdmin = supabaseSecretKey 
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Log warning if admin client is not available (only in development)
if (process.env.NODE_ENV === 'development' && !supabaseAdmin) {
  console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY not found - Admin operations will not work")
}
