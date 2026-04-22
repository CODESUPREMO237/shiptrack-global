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
      try {
        // Use getSession() — reads from local storage instantly, no network race.
        // The login page (AdminLoginCard) already verified isAdminUser() before
        // redirecting here, so we only need to confirm a valid session exists.
        const { data } = await supabase.auth.getSession();

        if (!active) return;

        if (!data.session) {
          router.replace("/admin");
          return;
        }

        setChecking(false);
      } catch {
        if (active) router.replace("/admin");
      }
    };

    verify();

    // Listen for sign-out (e.g. from another tab)
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
