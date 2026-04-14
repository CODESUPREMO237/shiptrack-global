"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthTextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  icon: Icon,
  inputMode,
  disabled = false,
  allowTogglePassword = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password" && allowTogglePassword;
  const actualType = useMemo(() => {
    if (!isPasswordField) return type;
    return showPassword ? "text" : "password";
  }, [isPasswordField, showPassword, type]);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input
          id={id}
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          className={`w-full rounded-2xl border px-4 py-3 text-slate-900 outline-none transition ${
            Icon ? "pl-11" : ""
          } ${
            isPasswordField ? "pr-12" : ""
          } ${
            error
              ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-4 focus:ring-red-100"
              : "border-slate-300 bg-slate-50 focus:border-[#4d148c] focus:bg-white focus:ring-4 focus:ring-[#4d148c]/10"
          }`}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#4d148c]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
