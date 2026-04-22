"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    // onAuthStateChange fires immediately with the current session state —
    // it does NOT wait for a network call and works reliably on mobile.
    // The INITIAL_SESSION event gives us the session that was set during login.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT" || !session) {
        router.replace("/admin");
        return;
      }

      // INITIAL_SESSION, SIGNED_IN, or TOKEN_REFRESHED with a valid session
      setChecking(false);
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
