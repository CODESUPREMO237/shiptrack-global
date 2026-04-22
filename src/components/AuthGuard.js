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

    // Safety net: if auth check hangs for more than 8 seconds, redirect to login
    const timeout = setTimeout(() => {
      if (active && checking) {
        active = false;
        router.replace("/admin");
      }
    }, 8000);

    const loadUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!active) return;

        if (error || !isAdminUser(data?.user)) {
          router.replace("/admin");
          return;
        }

        setChecking(false);
      } catch {
        if (!active) return;
        router.replace("/admin");
      } finally {
        clearTimeout(timeout);
      }
    };

    loadUser();

    return () => {
      active = false;
      clearTimeout(timeout);
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
