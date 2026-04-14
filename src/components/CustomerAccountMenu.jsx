"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, UserCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { isAdminUser } from "@/lib/authRoles";

function getDisplayName(user) {
  const fullName = user?.user_metadata?.full_name?.trim();
  const firstName = user?.user_metadata?.first_name?.trim();
  const email = user?.email?.trim();

  return fullName || firstName || email || "Account";
}

export default function CustomerAccountMenu({ mobile = false, onAction }) {
  const router = useRouter();
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (active) setUser(data.user ?? null);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      if (active) setUser(data.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (mobile) return undefined;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobile]);

  const destination = useMemo(() => {
    if (!user) return "/sign-in";
    return isAdminUser(user) ? "/admin/dashboard" : "/account";
  }, [user]);

  const label = useMemo(() => getDisplayName(user), [user]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setOpen(false);
    onAction?.();
    router.push("/");
    router.refresh();
    setSigningOut(false);
  };

  if (!user) {
    return (
      <>
        <Link
          href="/sign-in"
          onClick={onAction}
          className={mobile ? "block py-1.5 text-sm font-medium text-gray-700 hover:text-[#4D148C]" : "rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#4D148C] hover:text-[#4D148C]"}
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          onClick={onAction}
          className={mobile ? "block py-1.5 text-sm font-medium text-gray-700 hover:text-[#4D148C]" : "rounded-full bg-[#FF6600] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e55a00]"}
        >
          Create Account
        </Link>
      </>
    );
  }

  if (mobile) {
    return (
      <div className="space-y-2">
        <Link
          href={destination}
          onClick={onAction}
          className="flex items-center gap-2 py-1.5 text-sm font-medium text-gray-700 hover:text-[#4D148C]"
        >
          <UserCircle2 className="h-4 w-4" />
          {isAdminUser(user) ? "Admin Dashboard" : "My Account"}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 py-1.5 text-sm font-medium text-gray-700 hover:text-[#4D148C]"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? "Signing Out..." : "Sign Out"}
        </button>
      </div>
    );
  }

  return (
    <div className="relative hidden md:block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#4D148C] hover:text-[#4D148C]"
      >
        <UserCircle2 className="h-4 w-4" />
        <span className="max-w-[140px] truncate">{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {isAdminUser(user) ? "Admin Session" : "Signed In"}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">{label}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

          <div className="p-2">
            <Link
              href={destination}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-[#4D148C]"
            >
              <LayoutDashboard className="h-4 w-4" />
              {isAdminUser(user) ? "Open Admin Dashboard" : "Open My Account"}
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-[#4D148C]"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
