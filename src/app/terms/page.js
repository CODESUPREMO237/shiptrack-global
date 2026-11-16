"use client";

import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";
import { Package, FileText, AlertCircle, Scale, UserX, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">

        {/* Navbar */}
            <Navbar showFullNav={true} />
     

      {/* Hero Section */}
      <div className="bg-[#4D148C] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-5xl font-extrabold mb-4">Terms of Service</h1>
          <p className="text-xl opacity-90">
            Please read these terms carefully before using our services
          </p>
          <p className="text-sm mt-4 opacity-75">
            Last Updated: December 2024
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 shrink-0 mt-1" />
              <p className="text-gray-700">
                <strong>Important:</strong> By accessing or using ShipTrack Global's website and services, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <Scale className="w-8 h-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
            </div>
            <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-600">
              <p className="text-gray-700 mb-4">
                These Terms of Service constitute a legally binding agreement between you and ShipTrack Global. By using our services, you confirm that:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>You are at least 18 years of age or have parental/guardian consent</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>You have the legal capacity to enter into this agreement</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">•</span>
                  <span>You will comply with all applicable laws and regulations</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <UserX className="w-8 h-8 text-orange-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">2. Account Registration and Security</h2>
            </div>
            <p className="text-gray-700 mb-4">
              To access certain features, you may need to create an account. You are responsible for:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">Account Security</p>
                <p className="text-sm text-gray-600">Maintaining the confidentiality of your login credentials and notifying us immediately of any unauthorized access</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">Accurate Information</p>
                <p className="text-sm text-gray-600">Providing truthful, accurate, and complete information during registration and keeping it updated</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">Account Responsibility</p>
                <p className="text-sm text-gray-600">All activities under your account, whether authorized by you or not</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">Single Account</p>
                <p className="text-sm text-gray-600">Creating only one account per user; duplicate accounts may be suspended</p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <Package className="w-8 h-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">3. Use of Services</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Our services must be used in compliance with all applicable laws. You agree <strong>NOT</strong> to:
            </p>
            <div className="bg-red-50 p-6 rounded-xl border-l-4 border-red-500">
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  <span>Ship illegal, prohibited, or dangerous items</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  <span>Use our services for fraudulent, harmful, or unlawful activities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  <span>Attempt to hack, disrupt, or compromise our systems</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  <span>Violate any applicable shipping regulations or customs laws</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  <span>Impersonate others or misrepresent your identity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  <span>Interfere with other users' access to our services</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <FileText className="w-8 h-8 text-orange-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">4. Intellectual Property Rights</h2>
            </div>
            <p className="text-gray-700 mb-4">
              All content on our website, including but not limited to text, graphics, logos, images, software, and trademarks, is the property of ShipTrack Global or its licensors and is protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-700">
              You may not copy, reproduce, distribute, modify, or create derivative works without our express written permission.
            </p>
          </div>

          {/* Section 5 */}
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-8 h-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">5. Limitation of Liability</h2>
            </div>
            <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-600">
              <p className="text-gray-700 mb-4">
                To the fullest extent permitted by law:
              </p>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>• ShipTrack Global is not liable for any indirect, incidental, special, consequential, or punitive damages</li>
                <li>• Our services are provided "as-is" and "as available" without warranties of any kind</li>
                <li>• We do not guarantee uninterrupted or error-free service</li>
                <li>• We are not responsible for delays caused by customs, weather, carrier issues, or force majeure events</li>
                <li>• Total liability for any claim shall not exceed the amount paid for the specific service</li>
              </ul>
            </div>
          </div>

          {/* Section 6 */}
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <RefreshCw className="w-8 h-8 text-orange-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">6. Modifications to Terms</h2>
            </div>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting on our website. We will notify users of significant changes via:
            </p>
            <ul className="space-y-2 ml-6 text-gray-700">
              <li>→ Email notification to registered users</li>
              <li>→ Prominent notice on our website</li>
              <li>→ In-app notifications (if applicable)</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Your continued use of our services after changes constitutes acceptance of the modified terms.
            </p>
          </div>

          {/* Section 7 */}
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <UserX className="w-8 h-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">7. Account Termination</h2>
            </div>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your account at our sole discretion if you:
            </p>
            <div className="bg-orange-50 p-6 rounded-xl border-l-4 border-orange-500">
              <ul className="space-y-2 text-gray-700">
                <li>• Violate these Terms of Service</li>
                <li>• Engage in fraudulent or illegal activities</li>
                <li>• Provide false or misleading information</li>
                <li>• Repeatedly violate shipping regulations</li>
                <li>• Fail to pay for services rendered</li>
              </ul>
            </div>
            <p className="text-gray-700 mt-4">
              You may terminate your account at any time by contacting our support team. Upon termination, your access to our services will cease.
            </p>
          </div>

          {/* Section 8 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              Any disputes arising from these Terms or our services shall be resolved through:
            </p>
            <ol className="space-y-2 ml-6 text-gray-700">
              <li>1. <strong>Informal Resolution:</strong> Good-faith negotiation between the parties</li>
              <li>2. <strong>Mediation:</strong> If informal resolution fails, binding mediation</li>
              <li>3. <strong>Arbitration:</strong> Final and binding arbitration under applicable laws</li>
            </ol>
          </div>

          {/* Section 9 */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ShipTrack Global operates, without regard to its conflict of law provisions.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-purple-50 p-8 rounded-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2">
              <p className="text-gray-900">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:legal@shiptrackglobal.com"
                  className="text-purple-600 hover:underline"
                >
                 shiptrackglobal@gmail.com

                </a>
              </p>
              <p className="text-gray-900">
                <strong>Support:</strong>{" "}
                <a
                  href="mailto:support@shiptrackglobal.com"
                  className="text-purple-600 hover:underline"
                >
                 shiptrackglobal@gmail.com

                </a>
              </p>
              <p className="text-gray-900">
                <strong>Phone:</strong>{" "}
                <a href="tel:+19297829204" className="text-purple-600 hover:underline">
                  +1 929 782 9204
                </a>
              </p>
            </div>
          </div>

          {/* Agreement */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl border-2 border-purple-200">
            <p className="text-center text-gray-700 font-medium">
              By using ShipTrack Global's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
            <Link href="/policy" className="text-gray-400 hover:text-white transition">
              Privacy Policy
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