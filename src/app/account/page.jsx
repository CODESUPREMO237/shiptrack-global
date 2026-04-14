"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  KeyRound,
  LogOut,
  Mail,
  PackageSearch,
  Shield,
  UserCircle2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import CustomerAuthGuard from "@/components/CustomerAuthGuard";
import AuthTextField from "@/components/AuthTextField";
import { supabase } from "@/lib/supabaseClient";
import { validateEmail, validateName } from "@/lib/authValidation";

function formatDate(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user ?? null;

      if (!active || !currentUser) return;

      setUser(currentUser);
      setForm({
        firstName: currentUser.user_metadata?.first_name || "",
        lastName: currentUser.user_metadata?.last_name || "",
        email: currentUser.email || "",
      });
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setUser(data.user ?? null);
      if (data.user) {
        setForm({
          firstName: data.user.user_metadata?.first_name || "",
          lastName: data.user.user_metadata?.last_name || "",
          email: data.user.email || "",
        });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const fullName = useMemo(() => {
    const name = `${form.firstName} ${form.lastName}`.trim();
    return name || user?.email || "Customer";
  }, [form.firstName, form.lastName, user]);

  const validateForm = () => {
    const nextErrors = {};
    const firstNameError = validateName(form.firstName, "First name");
    const lastNameError = validateName(form.lastName, "Last name");
    const emailError = validateEmail(form.email);

    if (firstNameError) nextErrors.firstName = firstNameError;
    if (lastNameError) nextErrors.lastName = lastNameError;
    if (emailError) nextErrors.email = emailError;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setStatus("");

    if (!validateForm()) return;
    if (!user) return;

    setSaving(true);

    try {
      const updates = {
        data: {
          ...user.user_metadata,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        },
      };

      if (form.email.trim() !== user.email) {
        updates.email = form.email.trim();
      }

      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      setUser(data.user);
      setStatus(
        form.email.trim() !== user.email
          ? "Profile updated. Check your inbox if email confirmation is required for the address change."
          : "Profile updated successfully."
      );
    } catch (err) {
      console.error("Profile update error:", err);
      setStatus(err.message || "Unable to update your profile right now.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setStatus("");
    setResettingPassword(true);

    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo });
      if (error) throw error;

      setStatus("Password reset instructions have been sent to your email.");
    } catch (err) {
      console.error("Password reset error:", err);
      setStatus(err.message || "Unable to send a password reset email right now.");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
    setSigningOut(false);
  };

  return (
    <CustomerAuthGuard>
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_36%,#fff7ed_100%)]">
        <Navbar showFullNav />

        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
          <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_44%,#4d148c_100%)] px-6 py-8 text-white md:px-10 md:py-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-300">My Account</p>
                  <h1 className="mt-4 text-3xl font-black md:text-5xl">{fullName}</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                    Manage your profile, keep your account details up to date, and access secure recovery actions from one place.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Member Since</p>
                    <p className="mt-2 text-sm font-semibold">{formatDate(user?.created_at)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Last Sign In</p>
                    <p className="mt-2 text-sm font-semibold">{formatDate(user?.last_sign_in_at)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Account Type</p>
                    <p className="mt-2 text-sm font-semibold">Customer</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 px-5 py-6 md:px-8 md:py-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-2xl bg-[#4d148c]/10 p-3">
                      <UserCircle2 className="h-6 w-6 text-[#4d148c]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">Profile Details</h2>
                      <p className="text-sm text-slate-500">All fields are validated before your account is updated.</p>
                    </div>
                  </div>

                  {status && (
                    <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${status.toLowerCase().includes("updated") || status.toLowerCase().includes("sent") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                      {status}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <AuthTextField
                        id="accountFirstName"
                        label="First name"
                        value={form.firstName}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, firstName: e.target.value }));
                          setErrors((prev) => ({ ...prev, firstName: "" }));
                        }}
                        placeholder="Ada"
                        error={errors.firstName}
                        autoComplete="given-name"
                        icon={UserCircle2}
                        disabled={saving}
                      />
                      <AuthTextField
                        id="accountLastName"
                        label="Last name"
                        value={form.lastName}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, lastName: e.target.value }));
                          setErrors((prev) => ({ ...prev, lastName: "" }));
                        }}
                        placeholder="Okafor"
                        error={errors.lastName}
                        autoComplete="family-name"
                        icon={UserCircle2}
                        disabled={saving}
                      />
                    </div>

                    <AuthTextField
                      id="accountEmail"
                      label="Email address"
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, email: e.target.value }));
                        setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="you@example.com"
                      error={errors.email}
                      autoComplete="email"
                      inputMode="email"
                      icon={Mail}
                      disabled={saving}
                    />

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4d148c_0%,#ff6a13_100%)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4d148c]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving Profile..." : "Save Profile Changes"}
                    </button>
                  </form>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-2xl bg-orange-100 p-3">
                      <PackageSearch className="h-6 w-6 text-[#ff6a13]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">Quick Actions</h2>
                      <p className="text-sm text-slate-500">Jump back into the parts of the website customers use most.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Link
                      href="/track"
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-[#4d148c] hover:bg-white"
                    >
                      <p className="text-sm font-semibold text-slate-900">Track a Shipment</p>
                      <p className="mt-2 text-sm text-slate-500">Check live movement, history, and delivery progress.</p>
                    </Link>
                    <Link
                      href="/support"
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-[#4d148c] hover:bg-white"
                    >
                      <p className="text-sm font-semibold text-slate-900">Contact Support</p>
                      <p className="mt-2 text-sm text-slate-500">Reach the team if you need account or shipment help.</p>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-100 p-3">
                      <Shield className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">Security</h2>
                      <p className="text-sm text-slate-500">Use secure recovery tools instead of risky manual password handling.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <KeyRound className="mt-1 h-5 w-5 text-[#4d148c]" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Send password reset email</p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            We will send a password recovery link to <span className="font-medium text-slate-700">{user?.email}</span>.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        disabled={resettingPassword}
                        className="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#4d148c] hover:text-[#4d148c] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resettingPassword ? "Sending Email..." : "Send Password Reset"}
                      </button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <BadgeCheck className="mt-1 h-5 w-5 text-[#ff6a13]" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Profile sync</p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Your first name, last name, and full name are stored in Supabase user metadata for future customer features.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 md:p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3">
                      <CalendarDays className="h-6 w-6 text-slate-700" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-950">Session Overview</h2>
                      <p className="text-sm text-slate-500">Helpful account details pulled from your current Supabase user record.</p>
                    </div>
                  </div>

                  <dl className="space-y-4 text-sm">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">User ID</dt>
                      <dd className="mt-1 break-all font-medium text-slate-900">{user?.id || "Not available"}</dd>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">Email confirmed</dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        {user?.email_confirmed_at ? "Yes" : "Pending confirmation"}
                      </dd>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">Last sign in</dt>
                      <dd className="mt-1 font-medium text-slate-900">{formatDate(user?.last_sign_in_at)}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#4d148c] hover:text-[#4d148c] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    {signingOut ? "Signing Out..." : "Sign Out"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </CustomerAuthGuard>
  );
}
