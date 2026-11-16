"use client";

import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";
import { Shield, FileText, Lock, Globe, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
            <Navbar showFullNav={true} />
     

      {/* Hero */}
      <div className="bg-[#4D148C] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Lock className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-5xl font-extrabold mb-4">Privacy Policy</h1>
          <p className="text-xl opacity-90">Your privacy and data protection matter to us.</p>
          <p className="text-sm mt-4 opacity-75">Last Updated: December 2024</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-lg border border-gray-100">

          {/* Section 1 */}
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <FileText className="w-8 h-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
            </div>
            <ul className="space-y-2 text-gray-700 bg-purple-50 p-6 rounded-xl border-l-4 border-purple-600">
              <li>• Personal details (name, email, phone)</li>
              <li>• Website usage analytics</li>
              <li>• Device, IP address & browser information</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">2. How We Use Your Data</h2>
            <p className="text-gray-700 mb-4">
              We use your information to:
            </p>
            <ul className="space-y-2 text-gray-700 ml-6">
              <li>→ Provide and improve services</li>
              <li>→ Communicate updates and support notifications</li>
              <li>→ Protect our platform from fraud and abuse</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">3. Sharing of Data</h2>
            <p className="text-gray-700 bg-yellow-50 p-6 rounded-xl border-l-4 border-yellow-400">
              We do not sell your data. Limited sharing occurs only with trusted service providers and when required by law.
            </p>
          </div>

          {/* Section 4 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">4. Cookies & Tracking</h2>
            <p className="text-gray-700">
              Cookies help us understand how you use our site. You may disable them in your browser settings.
            </p>
          </div>

          {/* Section 5 */}
          <div className="mb-10">
            <Globe className="w-8 h-8 text-orange-500 mb-3" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">5. Data Security</h2>
            <p className="text-gray-700">
              Industry-grade protections safeguard your information, but no system is 100% breach-proof.
            </p>
          </div>

          {/* Section 6 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">6. Your Data Rights</h2>
            <ul className="space-y-2 text-gray-700 ml-6">
              <li>✔ Request access or deletion of your data</li>
              <li>✔ Update your account information</li>
              <li>✔ Opt-out of marketing emails anytime</li>
            </ul>
          </div>

          {/* Section 7 */}
          <div className="bg-purple-50 p-8 rounded-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Contact Us</h2>
            <p className="text-gray-700 mb-2">If you have any privacy questions:</p>
            <p className="text-gray-900">
              <strong>Email:</strong>{" "}
              <a href="mailto:support@shiptrackglobal.com" className="text-purple-600 hover:underline">
               shiptrackglobal@gmail.com

              </a>
            </p>
          </div>

        </div>
      </div>

      <ChatWidget />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} ShipTrack Global. All Rights Reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link href="/terms" className="text-gray-400 hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="/support" className="text-gray-400 hover:text-white transition">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
