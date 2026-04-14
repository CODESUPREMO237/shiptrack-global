"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import AuthPageShell from "@/components/AuthPageShell";
import AuthTextField from "@/components/AuthTextField";
import { supabase } from "@/lib/supabaseClient";
import { validateEmail } from "@/lib/authValidation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (active && data.user) router.replace("/track");
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setSubmitting(true);

    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (resetError) throw resetError;

      setStatus("Password reset instructions have been sent to your email.");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.message || "Unable to send reset instructions right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Password Recovery"
      title="Reset your password"
      subtitle="Enter your email and we will send a secure password reset link."
      sideTitle="Recovery should feel calm, clear, and secure."
      sideCopy="This flow is powered by Supabase email recovery so customer and admin credentials stay in the same auth system."
      footerText="Remembered your password?"
      footerLinkHref="/sign-in"
      footerLinkLabel="Back to sign in"
    >
      {status && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div>}
      {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthTextField
          id="forgotEmail"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="you@example.com"
          error=""
          autoComplete="email"
          inputMode="email"
          icon={Mail}
          disabled={submitting}
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4d148c_0%,#ff6a13_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#4d148c]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending Link..." : "Send Reset Link"}
        </button>
      </form>
    </AuthPageShell>
  );
}
