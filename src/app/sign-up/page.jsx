"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, User } from "lucide-react";
import AuthPageShell from "@/components/AuthPageShell";
import AuthTextField from "@/components/AuthTextField";
import { supabase } from "@/lib/supabaseClient";
import { validateEmail, validateName, validatePassword } from "@/lib/authValidation";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
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

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    const firstNameError = validateName(form.firstName, "First name");
    const lastNameError = validateName(form.lastName, "Last name");
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    if (firstNameError) nextErrors.firstName = firstNameError;
    if (lastNameError) nextErrors.lastName = lastNameError;
    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords do not match.";
    if (!form.confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
    if (!form.terms) nextErrors.terms = "You must accept the terms to create an account.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/sign-in?check-email=1` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        router.replace("/track");
        return;
      }

      setStatus("Your account was created. Check your email to confirm it before signing in.");
    } catch (err) {
      console.error("Sign up error:", err);
      setStatus(err.message || "Unable to create your account right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPageShell
      eyebrow="Create Account"
      title="Set up your shipping profile"
      subtitle="Create a secure customer account with fully validated details and password rules."
      sideTitle="A faster checkout and tracking experience starts here."
      sideCopy="Your account can store profile metadata for future delivery tools without mixing customer access with admin controls."
      footerText="Already have an account?"
      footerLinkHref="/sign-in"
      footerLinkLabel="Sign in"
    >
      {status && (
        <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${status.toLowerCase().includes("created") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {status}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <AuthTextField
            id="firstName"
            label="First name"
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="Ada"
            error={errors.firstName}
            autoComplete="given-name"
            icon={User}
            disabled={submitting}
          />
          <AuthTextField
            id="lastName"
            label="Last name"
            value={form.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Okafor"
            error={errors.lastName}
            autoComplete="family-name"
            icon={User}
            disabled={submitting}
          />
        </div>

        <AuthTextField
          id="signUpEmail"
          label="Email address"
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="you@example.com"
          error={errors.email}
          autoComplete="email"
          inputMode="email"
          icon={Mail}
          disabled={submitting}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <AuthTextField
            id="signUpPassword"
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            placeholder="At least 8 characters"
            error={errors.password}
            autoComplete="new-password"
            icon={LockKeyhole}
            allowTogglePassword
            disabled={submitting}
          />
          <AuthTextField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
            autoComplete="new-password"
            icon={LockKeyhole}
            allowTogglePassword
            disabled={submitting}
          />
        </div>

        <div className={`rounded-2xl border px-4 py-3 ${errors.terms ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => updateField("terms", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4d148c] focus:ring-[#4d148c]"
              disabled={submitting}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-semibold text-[#4d148c] hover:text-[#ff6a13]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/policy" className="font-semibold text-[#4d148c] hover:text-[#ff6a13]">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && <p className="mt-2 text-sm text-red-600">{errors.terms}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4d148c_0%,#ff6a13_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#4d148c]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </AuthPageShell>
  );
}
