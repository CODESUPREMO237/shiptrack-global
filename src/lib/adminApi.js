import { supabase } from "@/lib/supabaseClient";

// Key used to stash the token in sessionStorage at login time
const TOKEN_KEY = "admin_access_token";

// Call this right after a successful signInWithPassword to cache the token
export function storeAdminToken(token) {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
}

export function clearAdminToken() {
  try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
}

export async function getAdminAccessToken() {
  // 1. Try sessionStorage (set at login — survives route changes on mobile)
  try {
    const cached = sessionStorage.getItem(TOKEN_KEY);
    if (cached) return cached;
  } catch {}

  // 2. Try Supabase getSession()
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) {
    storeAdminToken(token); // cache it for next time
    return token;
  }

  throw new Error("Admin session not found. Please sign in again.");
}

export async function adminFetch(input, init = {}, timeoutMs = 30000) {
  const token = await getAdminAccessToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, { ...init, headers, signal: controller.signal });

    // If token expired (401), clear cached token and retry once with a fresh session
    if (response.status === 401) {
      clearTimeout(timer);
      try { sessionStorage.removeItem("admin_access_token"); } catch {}

      // Force Supabase to refresh the session
      const { data: refreshData } = await supabase.auth.refreshSession();
      const freshToken = refreshData?.session?.access_token;
      if (!freshToken) throw new Error("Session expired. Please sign in again.");

      storeAdminToken(freshToken);
      const retryHeaders = new Headers(init.headers || {});
      retryHeaders.set("Authorization", `Bearer ${freshToken}`);
      if (!retryHeaders.has("Content-Type") && init.body) {
        retryHeaders.set("Content-Type", "application/json");
      }
      const retryController = new AbortController();
      const retryTimer = setTimeout(() => retryController.abort(), timeoutMs);
      try {
        return await fetch(input, { ...init, headers: retryHeaders, signal: retryController.signal });
      } finally {
        clearTimeout(retryTimer);
      }
    }

    return response;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Request timed out. Please check your connection.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
