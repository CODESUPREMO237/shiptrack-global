"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import AuthPageShell from "@/components/AuthPageShell";
import AuthTextField from "@/components/AuthTextField";
import { supabase } from "@/lib/supabaseClient";
import { validatePassword } from "@/lib/authValidation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const syncRecoveryState = async () => {
      const { data } = await supabase.auth.getSession();
      if (active && data.session) setReady(true);
    };

    syncRecoveryState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      router.replace("/sign-in?reset=1");
    } catch (err) {
      console.error("Reset password error:", err);
      setStatus(err.message || "Unable to update your password right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Set New Password"
      title="Choose a fresh password"
      subtitle="Finish the password recovery flow with a fully validated new password."
      sideTitle="One last step and your account is back."
      sideCopy="Open the recovery link from your email first. Once the recovery session is active, you can safely set a new password here."
      footerText="Need another reset email?"
      footerLinkHref="/forgot-password"
      footerLinkLabel="Request a new one"
    >
      {!ready && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Open the password recovery link from your email to activate this page.
        </div>
      )}

      {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {status && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{status}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthTextField
          id="newPassword"
          label="New password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="At least 8 characters with upper, lower, and number"
          error=""
          autoComplete="new-password"
          icon={LockKeyhole}
          allowTogglePassword
          disabled={!ready || submitting}
        />

        <AuthTextField
          id="confirmNewPassword"
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
          placeholder="Re-enter the new password"
          error=""
          autoComplete="new-password"
          icon={LockKeyhole}
          allowTogglePassword
          disabled={!ready || submitting}
        />

        <button
          type="submit"
          disabled={!ready || submitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4d148c_0%,#ff6a13_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#4d148c]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Updating Password..." : "Save New Password"}
        </button>
      </form>
    </AuthPageShell>
  );
}
