"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { validateEmail, validatePassword } from "@/lib/authValidation";

export default function AdminSecurityPanel() {
  const [accountEmail, setAccountEmail] = useState("");
  const [nextEmail, setNextEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email || "";

      if (!active) return;

      setAccountEmail(email);
      setNextEmail(email);
    };

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const hasEmailChange = useMemo(
    () => nextEmail.trim() && nextEmail.trim() !== accountEmail,
    [nextEmail, accountEmail]
  );

  const hasPasswordChange = useMemo(() => newPassword.length > 0, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = nextEmail.trim();

    if (!accountEmail) {
      setError("No authenticated admin session found. Please sign in again.");
      return;
    }

    if (!currentPassword) {
      setError("Enter your current password to confirm this change.");
      return;
    }

    if (!hasEmailChange && !hasPasswordChange) {
      setError("Update the email, password, or both before saving.");
      return;
    }

    if (hasEmailChange) {
      const emailError = validateEmail(normalizedEmail);
      if (emailError) {
        setError(emailError);
        return;
      }
    }

    if (hasPasswordChange) {
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("New password and confirmation do not match.");
        return;
      }
    }

    setSaving(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: accountEmail,
        password: currentPassword,
      });

      if (signInError) {
        throw signInError;
      }

      const updates = {};

      if (hasEmailChange) {
        updates.email = normalizedEmail;
      }

      if (hasPasswordChange) {
        updates.password = newPassword;
      }

      const { error: updateError } = await supabase.auth.updateUser(updates);

      if (updateError) {
        throw updateError;
      }

      if (hasEmailChange) {
        setAccountEmail(normalizedEmail);
        setNextEmail(normalizedEmail);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (hasEmailChange && hasPasswordChange) {
        setSuccess("Admin email and password updated. If email confirmations are enabled, check the inbox to finish the email change.");
      } else if (hasEmailChange) {
        setSuccess("Admin email update submitted. If email confirmations are enabled, check the inbox to finish the change.");
      } else {
        setSuccess("Admin password updated successfully.");
      }
    } catch (err) {
      console.error("Failed to update admin credentials:", err);

      if (err.message?.toLowerCase().includes("invalid login credentials")) {
        setError("Current password is incorrect.");
      } else if (err.message?.toLowerCase().includes("already")) {
        setError("That email address is already in use.");
      } else {
        setError(err.message || "Unable to update admin credentials right now.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Security</h2>
          <p className="text-sm text-gray-500">Change the admin email and password for this Supabase account.</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Signed in as <span className="font-semibold">{accountEmail || "Unknown admin"}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">New Admin Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={nextEmail}
              onChange={(e) => setNextEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="admin@example.com"
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-12 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Leave blank to keep current password"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-[#4d148c]"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 pr-12 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Re-enter the new password"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-[#4d148c]"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 pr-12 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Required to confirm changes"
              disabled={saving}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-[#4d148c]"
              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            We verify your current password before applying sensitive account changes.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-4 h-4" />
          {saving ? "Saving Changes..." : "Update Admin Credentials"}
        </button>
      </form>
    </div>
  );
}
