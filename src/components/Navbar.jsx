"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import CustomerAccountMenu from "@/components/CustomerAccountMenu";
import ReviewToast from "@/components/ReviewToast";

// Navigation Link Component
const NavLink = ({ href, children, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className="block md:inline-block text-gray-700 hover:text-[#4D148C] transition-colors duration-200 py-2 md:py-0 font-medium text-sm"
  >
    {children}
  </Link>
);

// Dropdown Menu Component
const DropdownMenu = ({ title, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-1 text-gray-700 hover:text-[#4D148C] transition-colors duration-200 font-medium text-sm">
        {title}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
          {items.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="block px-4 py-2.5 hover:bg-[#f0ebfa] transition duration-150"
            >
              <div className="font-semibold text-gray-800 text-sm">{item.title}</div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// Inline Track Form
const InlineTrackForm = () => {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleTrack = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    router.push(`/track?code=${trimmed}`);
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); handleTrack(); }}
      className="hidden lg:flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:border-[#4D148C] focus-within:ring-1 focus-within:ring-[#4D148C] transition"
    >
      <input
        type="text"
        placeholder="Enter tracking number"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="px-3 py-1.5 text-sm text-gray-800 bg-white outline-none w-44"
      />
      <button
        type="submit"
        className="px-3 py-1.5 bg-[#FF6600] hover:bg-[#cc5200] text-white text-sm font-semibold transition-colors flex items-center gap-1"
      >
        <Search className="w-3.5 h-3.5" />
        Track
      </button>
    </form>
  );
};

export default function Navbar({ showFullNav = true }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCode, setMobileCode] = useState("");
  const router = useRouter();

  const servicesItems = [
    { title: "Express Shipping", description: "Fast delivery for urgent shipments", href: "/services/express" },
    { title: "Freight Services", description: "Large volume shipping solutions", href: "/services/freight" },
    { title: "International Shipping", description: "Global delivery network", href: "/services/international" },
    { title: "Supply Chain Solutions", description: "End-to-end logistics management", href: "/services/supply-chain" },
  ];

  const handleMobileTrack = (e) => {
    e.preventDefault();
    const trimmed = mobileCode.trim().toUpperCase();
    if (!trimmed) return;
    setMobileMenuOpen(false);
    router.push(`/track?code=${trimmed}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <ReviewToast />
      {/* Utility bar — top strip */}
      <div className="bg-gray-900 text-gray-300 text-xs hidden md:block">
        <div className="container mx-auto px-4 py-1.5 flex justify-between items-center">
          <span>Worldwide shipping & logistics solutions</span>
          <div className="flex items-center gap-5">
            <a href="tel:+19297829204" className="hover:text-white transition">+1 929 782 9204</a>
            <Link href="/support" className="hover:text-white transition">Contact Us</Link>
            <Link href="/about" className="hover:text-white transition">About</Link>
            <Link href="/account" className="hover:text-white transition">My Account</Link>
          </div>
        </div>
      </div>

      {/* Main nav bar */}
      <div className="container mx-auto px-4 py-2 flex justify-between items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <img
            src="/logo/logo-modern.svg"
            alt="ShipTrack Global Logo"
            className="h-10 md:h-11 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        {showFullNav ? (
          <>
            <nav className="hidden md:flex items-center space-x-6 text-sm flex-1 justify-center">
              <NavLink href="/">Home</NavLink>
              <DropdownMenu title="Services" items={servicesItems} />
              <NavLink href="/track">Tracking</NavLink>
              <NavLink href="/support">Support</NavLink>
            </nav>

            {/* Inline tracking input (desktop) */}
            <InlineTrackForm />

            <div className="hidden md:flex items-center gap-3">
              <CustomerAccountMenu />
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden text-gray-700 focus:outline-none ml-auto"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </>
        ) : (
          <Link href="/" className="text-gray-600 hover:text-[#4D148C] font-medium transition-colors duration-200 text-sm ml-auto">
            ← Back to Home
          </Link>
        )}
      </div>

      {/* Mobile Navigation */}
      {showFullNav && mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 shadow-lg">
          {/* Mobile tracking input */}
          <form onSubmit={handleMobileTrack} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter tracking number"
              value={mobileCode}
              onChange={(e) => setMobileCode(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:border-[#4D148C]"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[#FF6600] text-white text-sm font-semibold rounded-md"
            >
              Track
            </button>
          </form>

          <div className="font-semibold text-gray-900 text-xs uppercase tracking-wider mb-1">Services</div>
          {servicesItems.map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className="block pl-3 py-1.5 text-gray-600 hover:text-[#4D148C] transition-colors text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.title}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <NavLink href="/track" onClick={() => setMobileMenuOpen(false)}>Tracking</NavLink>
            <NavLink href="/support" onClick={() => setMobileMenuOpen(false)}>Support</NavLink>
            <NavLink href="/about" onClick={() => setMobileMenuOpen(false)}>About Us</NavLink>
            <CustomerAccountMenu mobile onAction={() => setMobileMenuOpen(false)} />
            <NavLink href="/" onClick={() => setMobileMenuOpen(false)}>Home</NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
