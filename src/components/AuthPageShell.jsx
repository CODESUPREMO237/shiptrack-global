"use client";

import Link from "next/link";

const defaultBullets = [
  "Track shipments and review delivery updates in one place",
  "Save contact details for faster shipping workflows",
  "Access secure password recovery and account management",
];

export default function AuthPageShell({
  eyebrow,
  title,
  subtitle,
  sideTitle,
  sideCopy,
  sideBullets = defaultBullets,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  children,
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,106,19,0.18),_transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_45%,#fff7ed_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-10 md:px-8 lg:flex-row lg:items-stretch lg:gap-8">
        <div className="mb-8 flex-1 rounded-[32px] border border-slate-200/70 bg-slate-950 px-7 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] lg:mb-0 lg:px-10 lg:py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a13]" />
            ShipTrack Global
          </Link>

          <div className="mt-12 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-300">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">{sideTitle}</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 md:text-lg">{sideCopy}</p>
          </div>

          <div className="mt-10 space-y-4">
            {sideBullets.map((bullet) => (
              <div
                key={bullet}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
                <p className="text-sm leading-6 text-slate-200">{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white/90 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
          <div className="rounded-[28px] border border-slate-100 bg-white px-5 py-6 md:px-8 md:py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4d148c]">{eyebrow}</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">{subtitle}</p>

            <div className="mt-8">{children}</div>

            {footerText && footerLinkHref && footerLinkLabel && (
              <p className="mt-8 text-sm text-slate-600">
                {footerText}{" "}
                <Link href={footerLinkHref} className="font-semibold text-[#4d148c] hover:text-[#ff6a13]">
                  {footerLinkLabel}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
