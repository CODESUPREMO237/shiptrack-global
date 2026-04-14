"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import ShippingCarousel from "@/components/ShippingCarousel";
import ChatWidget from "@/components/ChatWidget";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Truck, Globe, Clock, Shield, Search, Package, ArrowRight } from "lucide-react";

const stats = [
  { value: "220+", label: "Countries & territories" },
  { value: "10M+", label: "Shipments tracked" },
  { value: "99.9%", label: "On-time delivery" },
  { value: "24/7", label: "Customer support" },
];

const features = [
  {
    icon: <Truck className="w-6 h-6" style={{ color: "var(--brand-primary)" }} />,
    title: "Fast Delivery",
    description: "Express shipping with real-time tracking across the globe",
  },
  {
    icon: <Globe className="w-6 h-6" style={{ color: "var(--brand-accent)" }} />,
    title: "Global Network",
    description: "Reliable delivery to over 220 countries and territories",
  },
  {
    icon: <Shield className="w-6 h-6" style={{ color: "var(--brand-primary)" }} />,
    title: "Secure Shipping",
    description: "Insurance coverage and secure handling for every shipment",
  },
  {
    icon: <Clock className="w-6 h-6" style={{ color: "var(--brand-accent)" }} />,
    title: "24/7 Support",
    description: "Round-the-clock customer service whenever you need it",
  },
];

const services = [
  { title: "Express Shipping", desc: "Same-day & next-day delivery", href: "/services/express", icon: "⚡" },
  { title: "Freight Services", desc: "Large volume solutions", href: "/services/freight", icon: "🚚" },
  { title: "International", desc: "Global delivery network", href: "/services/international", icon: "🌐" },
  { title: "Supply Chain", desc: "End-to-end logistics", href: "/services/supply-chain", icon: "🔗" },
];

export default function Home() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleTrack = (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/track?code=${trimmed}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar showFullNav={true} />

      <main className="grow">
        {/* ── Hero Section ── */}
        <div className="relative py-24 md:py-36 text-white overflow-hidden min-h-[580px] flex items-center">
          <ShippingCarousel />
          {/* Darker, cleaner overlay */}
          <div className="absolute inset-0 bg-black/55 z-[1]" />

          <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight text-white">
              Ship Smarter.<br />Track Faster.
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Real-time tracking, global coverage, and 24/7 support — all in one place.
            </p>

            {/* Primary CTA: tracking input */}
            <form
              onSubmit={handleTrack}
              className="flex flex-col sm:flex-row gap-0 max-w-xl mx-auto mb-5 shadow-2xl rounded-lg overflow-hidden"
            >
              <div className="relative flex-1">
                <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter tracking number (e.g. SHPGMQTPE)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-4 text-gray-900 bg-white text-sm outline-none border-0"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-4 font-bold text-sm text-white flex items-center justify-center gap-2 whitespace-nowrap"
                style={{ backgroundColor: "var(--brand-accent)" }}
              >
                <Search className="w-4 h-4" />
                Track Shipment
              </button>
            </form>

            <Link
              href="/services/express"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition underline underline-offset-4"
            >
              Explore our services <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div className="bg-gray-900 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="text-3xl font-bold" style={{ color: "var(--brand-accent)" }}>{s.value}</div>
                  <div className="text-gray-400 text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Services Grid ── */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
              Shipping Solutions
            </h2>
            <p className="text-center text-gray-500 mb-10 text-sm">
              Tailored logistics for every need
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {services.map((svc, i) => (
                <Link
                  key={i}
                  href={svc.href}
                  className="group p-5 border border-gray-200 rounded-lg hover:border-[#4D148C] hover:shadow-md transition-all duration-200 text-center"
                >
                  <div className="text-3xl mb-2">{svc.icon}</div>
                  <div className="font-semibold text-gray-900 text-sm group-hover:text-[#4D148C] transition-colors">{svc.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{svc.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Why Choose Us ── */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
              Why ShipTrack Global?
            </h2>
            <p className="text-center text-gray-500 mb-10 text-sm">
              Built for businesses that demand reliability
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <div key={i} className="flex flex-col gap-3 p-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-primary-light)" }}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Trust Banner ── */}
        <div className="py-14" style={{ backgroundColor: "var(--brand-primary)" }}>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
              Trusted by 10,000+ Businesses Worldwide
            </h2>
            <p className="text-white/80 mb-7 text-sm md:text-base">
              Join the companies that rely on us for their shipping needs
            </p>
            <Link
              href="/about"
              className="inline-block px-7 py-3 bg-white font-semibold rounded text-sm transition hover:bg-gray-100"
              style={{ color: "var(--brand-primary)" }}
            >
              Learn More About Us
            </Link>
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">
              What Our Customers Say
            </h2>
            <p className="text-center text-gray-500 text-sm mb-10">Real feedback from real customers</p>
            <ReviewsCarousel />
          </div>
        </div>

        {/* ── CTA Section ── */}
        <div className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Ready to Ship?</h2>
            <p className="text-gray-500 mb-6 text-sm">Get started today and experience hassle-free shipping</p>
            <form
              onSubmit={handleTrack}
              className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto rounded-lg overflow-hidden border border-gray-300 shadow-sm"
            >
              <input
                type="text"
                placeholder="Enter your tracking number"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 text-gray-900 text-sm outline-none bg-white"
              />
              <button
                type="submit"
                className="px-5 py-3 text-white font-semibold text-sm"
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                Track Now
              </button>
            </form>
          </div>
        </div>
      </main>

      <ChatWidget />
    </div>
  );
}
