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

export async function adminFetch(input, init = {}, timeoutMs = 15000) {
  const makeRequest = async (token) => {
    const headers = new Headers(init.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...init, headers, signal: controller.signal });
    } catch (err) {
      if (err.name === "AbortError") throw new Error("Request timed out. Please check your connection.");
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  // First attempt with cached/current token
  let token;
  try {
    token = await getAdminAccessToken();
  } catch {
    throw new Error("Session expired. Please sign in again.");
  }

  const response = await makeRequest(token);

  // On 401, clear stale token and try to refresh session once
  if (response.status === 401) {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch {}

    let freshToken = null;
    try {
      // Try refresh with a 10s timeout
      const refreshPromise = supabase.auth.refreshSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Token refresh timed out")), 10000)
      );
      const { data: refreshData } = await Promise.race([refreshPromise, timeoutPromise]);
      freshToken = refreshData?.session?.access_token ?? null;
    } catch {
      freshToken = null;
    }

    if (!freshToken) {
      // Can't refresh — return the 401 so the caller can show a proper error
      return response;
    }

    storeAdminToken(freshToken);
    return makeRequest(freshToken);
  }

  return response;
}
