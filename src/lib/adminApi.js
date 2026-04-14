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

export async function adminFetch(input, init = {}) {
  const token = await getAdminAccessToken();
  const headers = new Headers(init.headers || {});

  headers.set("Authorization", `Bearer ${token}`);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
