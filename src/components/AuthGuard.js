"use client";
// AuthGuard is intentionally minimal — authentication is enforced at login
// (AdminLoginCard) and at the API layer (requireAdminUser). A redundant
// client-side re-check here causes race conditions on mobile where the
// Supabase session hasn't propagated yet.
export default function AuthGuard({ children }) {
  return children;
}
