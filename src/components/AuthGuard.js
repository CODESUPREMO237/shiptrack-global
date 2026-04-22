"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const verify = async () => {
      // Supabase on mobile can take a moment to write the session to storage
      // after login. Retry up to 5 times with 500ms gaps before giving up.
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const { data } = await supabase.auth.getSession();

          if (!active) return;

          if (data.session) {
            // Valid session found — let the user through
            setChecking(false);
            return;
          }
        } catch {
          // ignore and retry
        }

        // Wait 500ms before next attempt (total max wait: 2.5s)
        await new Promise((r) => setTimeout(r, 500));
      }

      // All attempts failed — send back to login
      if (active) router.replace("/admin");
    };

    verify();

    // Listen for explicit sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/admin");
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
