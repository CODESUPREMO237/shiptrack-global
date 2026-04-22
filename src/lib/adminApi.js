import { supabase } from "@/lib/supabaseClient";

export async function getAdminAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || "Unable to read the current admin session.");
  }

  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Admin session not found. Please sign in again.");
  }

  return token;
}

export async function adminFetch(input, init = {}, timeoutMs = 30000) {
  const token = await getAdminAccessToken();
  const headers = new Headers(init.headers || {});

  headers.set("Authorization", `Bearer ${token}`);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  // Abort after timeoutMs (default 30 seconds) so the UI never hangs forever
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
