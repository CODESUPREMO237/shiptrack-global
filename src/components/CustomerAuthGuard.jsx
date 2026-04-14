"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isAdminUser } from "@/lib/authRoles";

export default function CustomerAuthGuard({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!active) return;

      if (!data.user) {
        router.replace("/sign-in");
        return;
      }

      if (isAdminUser(data.user)) {
        router.replace("/admin/dashboard");
        return;
      }

      setChecking(false);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();

      if (!active) return;

      if (!data.user) {
        router.replace("/sign-in");
        return;
      }

      if (isAdminUser(data.user)) {
        router.replace("/admin/dashboard");
        return;
      }

      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          Loading your account...
        </div>
      </div>
    );
  }

  return children;
}
