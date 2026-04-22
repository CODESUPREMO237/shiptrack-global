import { supabase } from "@/lib/supabaseClient";

export async function getAdminAccessToken() {
  // Retry up to 6 times (3 seconds total) to get the session token.
  // On mobile, Supabase may not have read the token from storage yet.
  for (let i = 0; i < 6; i++) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) return token;
    await new Promise((r) => setTimeout(r, 500));
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
    const response = await fetch(input, {
      ...init,
      headers,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
