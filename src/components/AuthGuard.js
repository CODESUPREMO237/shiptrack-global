"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isAdminUser } from "@/lib/authRoles";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        // Step 1: Read the locally-cached session (instant, no network call).
        // This works even right after login before any network round-trip completes.
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (!active) return;

        // No session at all → send to login
        if (!session) {
          router.replace("/admin");
          return;
        }

        // Step 2: Validate the user object that came WITH the session.
        // app_metadata lives inside the JWT so it's available immediately.
        const user = session.user;

        if (!isAdminUser(user)) {
          // Last chance: maybe app_metadata isn't in the cached token yet.
          // Do one real network call to get the freshest user record.
          const { data: freshData } = await supabase.auth.getUser();
          if (!active) return;

          if (!isAdminUser(freshData?.user)) {
            router.replace("/admin");
            return;
          }
        }

        if (active) setChecking(false);
      } catch {
        if (active) router.replace("/admin");
      }
    };

    verify();

    // Also listen for auth state changes (e.g. token refresh, sign-out from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT" || !session) {
        router.replace("/admin");
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (isAdminUser(session.user)) {
          setChecking(false);
        } else {
          router.replace("/admin");
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm font-medium">Verifying admin session…</p>
        </div>
      </div>
    );
  }

  return children;
}
