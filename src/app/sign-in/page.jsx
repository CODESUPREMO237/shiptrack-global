"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import AuthPageShell from "@/components/AuthPageShell";
import AuthTextField from "@/components/AuthTextField";
import { supabase } from "@/lib/supabaseClient";
import { isAdminUser } from "@/lib/authRoles";
import { validateEmail } from "@/lib/authValidation";

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const notices = useMemo(() => {
    if (searchParams.get("reset") === "1") {
      return "Your password was updated. Sign in with your new password.";
    }

    if (searchParams.get("check-email") === "1") {
      return "Check your email to confirm your account before signing in.";
    }

    return "";
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();

      if (!active || !data.user) return;

      router.replace(isAdminUser(data.user) ? "/admin/dashboard" : "/track");
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  const validateForm = () => {
    const nextErrors = {};
    const emailError = validateEmail(email);

    if (emailError) nextErrors.email = emailError;
    if (!password) nextErrors.password = "Password is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      router.replace(isAdminUser(data.user) ? "/admin/dashboard" : "/track");
    } catch (err) {
      console.error("Sign in error:", err);
      setStatus(err.message || "Unable to sign in right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Customer Access"
      title="Sign in to your account"
      subtitle="Access your shipping profile, saved details, and faster support workflows."
      sideTitle="Shipping made easier when your account follows you."
      sideCopy="Use one secure Supabase-backed account for customer access, password recovery, and future shipment tools."
      footerText="Need an account?"
      footerLinkHref="/sign-up"
      footerLinkLabel="Create one"
    >
      {(notices || status) && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${status ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {status || notices}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthTextField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: "" }));
          }}
          placeholder="you@example.com"
          error={errors.email}
          autoComplete="email"
          inputMode="email"
          icon={Mail}
          disabled={submitting}
        />

        <AuthTextField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((prev) => ({ ...prev, password: "" }));
          }}
          placeholder="Enter your password"
          error={errors.password}
          autoComplete="current-password"
          icon={LockKeyhole}
          allowTogglePassword
          disabled={submitting}
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-500">Validated sign-in with secure session handling.</span>
          <Link href="/forgot-password" className="font-semibold text-[#4d148c] hover:text-[#ff6a13]">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4d148c_0%,#ff6a13_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#4d148c]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </AuthPageShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_50%,#fff7ed_100%)]" />}>
      <SignInPageContent />
    </Suspense>
  );
}
