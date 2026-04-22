"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { isAdminUser } from "@/lib/authRoles";
import { storeAdminToken } from "@/lib/adminApi";
import { validateEmail } from "@/lib/authValidation";

export default function AdminLoginCard({
  title = "Administrator Login",
  subtitle = "Access the shipment operations dashboard with your Supabase admin account.",
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let ignore = false;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!ignore && isAdminUser(data.session?.user)) {
        storeAdminToken(data.session.access_token);
      router.replace("/admin/dashboard");
      }
    };
    checkSession();
    return () => { ignore = true; };
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }
    if (!password) { setError("Password is required."); return; }

    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      if (!isAdminUser(data.user)) {
        await supabase.auth.signOut();
        setError("This account does not have admin access.");
        return;
      }

      storeAdminToken(data.session.access_token);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_50%,#fff7ed_100%)] p-4">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-slate-950 px-8 py-10 text-white md:px-10 md:py-12">
            <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a13]" />
              ShipTrack Global
            </Link>
            <div className="mt-12">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">Admin Access</p>
              <h1 className="mt-4 text-4xl font-black leading-tight">Operational control for live shipments.</h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-300 md:text-base">
                Sign in with a Supabase account that has the <span className="font-semibold text-white">admin</span> role
                in <span className="font-semibold text-white">app_metadata</span>.
              </p>
            </div>
            <div className="mt-10 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-orange-300" />
                  <p className="text-sm leading-6 text-slate-200">Supabase is now the single auth provider for admin access.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-orange-300" />
                  <p className="text-sm leading-6 text-slate-200">Admin-only API routes are verified using your Supabase session token.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 md:px-10 md:py-12">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4d148c]">Secure Sign In</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{subtitle}</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-[#4d148c] focus:bg-white focus:ring-4 focus:ring-[#4d148c]/10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-12 text-slate-900 outline-none transition focus:border-[#4d148c] focus:bg-white focus:ring-4 focus:ring-[#4d148c]/10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#4d148c]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4d148c_0%,#ff6a13_100%)] px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#4d148c]/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Open Admin Dashboard"}
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600">
              <Link href="/" className="font-medium text-[#4d148c] hover:text-[#ff6a13]">
                Return to website
              </Link>
              <Link href="/forgot-password" className="font-medium text-[#4d148c] hover:text-[#ff6a13]">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
