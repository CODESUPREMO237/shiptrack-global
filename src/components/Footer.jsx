
// ============================================
// FILE: src/components/Footer.jsx
// ============================================
"use client"
import React from 'react';
import Link from 'next/link';
import { Headphones } from 'lucide-react';

export default function Footer() {
  const handleCookieConsent = () => {
    localStorage.removeItem("cookie_consent");
    window.location.reload();
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <img 
                src="/logo/mark-modern.svg" 
                alt="ShipTrack Global" 
                className="h-10 w-10"
              />
            </Link>
            <p className="text-gray-400 text-sm">
              Your trusted partner for global shipping and logistics solutions.
            </p>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/services/express" className="hover:text-white transition">
                  Express Shipping
                </Link>
              </li>
              <li>
                <Link href="/services/freight" className="hover:text-white transition">
                  Freight Services
                </Link>
              </li>
              <li>
                <Link href="/services/international" className="hover:text-white transition">
                  International
                </Link>
              </li>
              <li>
                <Link href="/services/supply-chain" className="hover:text-white transition">
                  Supply Chain
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/track" className="hover:text-white transition">
                  Track Shipment
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/policy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                <span>+1 929 782 9204</span>
              </li>
              <li>support@shiptrackglobal.com</li>
              <li className="pt-4">
                <div className="flex gap-3">
                  <a 
                    href="#" 
                    className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center transition"
                    style={{':hover':{backgroundColor:'var(--brand-primary)'}}}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor='var(--brand-primary)'}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor=''}
                    aria-label="Facebook"
                  >
                    <span className="text-sm">f</span>
                  </a>
                  <a 
                    href="#" 
                    className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center transition"
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor='var(--brand-primary)'}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor=''}
                    aria-label="Twitter/X"
                  >
                    <span className="text-sm">𝕏</span>
                  </a>
                  <a 
                    href="#" 
                    className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center transition"
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor='var(--brand-primary)'}
                    onMouseLeave={e=>e.currentTarget.style.backgroundColor=''}
                    aria-label="LinkedIn"
                  >
                    <span className="text-sm">in</span>
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} ShipTrack Global. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="text-gray-500 hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="/policy" className="text-gray-500 hover:text-white transition">
              Privacy Policy
            </Link>
            <button 
              onClick={handleCookieConsent}
              className="text-gray-500 hover:text-white transition cursor-pointer"
            >
              Cookie Consent
            </button>
            <Link href="/support" className="text-gray-500 hover:text-white transition">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
