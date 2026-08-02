"use client";

import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";
import Navbar from "@/components/Navbar";
import { Mail, Phone, Clock, MessageCircle, FileQuestion } from "lucide-react";

export default function Support() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar showFullNav={true} />

      {/* Hero Section */}
      <div className="bg-linear-to-r from-purple-600 to-orange-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold mb-4">How Can We Help You?</h1>
          <p className="text-xl opacity-90">
            Our support team is ready to assist you 24/7
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition border border-gray-100">
            <Mail className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Get in touch via email</p>
            <a
              href="mailto:support@shiptrackglobal.com"
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              support@shiptrackglobal.com

            </a>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition border border-gray-100">
            <Phone className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Phone Support</h3>
            <p className="text-gray-600 mb-4">Call us anytime</p>
            <a
              href="tel:+19297829204"
              className="text-purple-600 hover:text-purple-700 font-semibold text-lg"
            >
              +1 929 782 9204
            </a>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition border border-gray-100">
            <MessageCircle className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">Chat with our team</p>
            <p className="text-gray-700 font-semibold">Mon–Fri, 9 AM – 5 PM</p>
            <p className="text-sm text-gray-500">(GMT+1)</p>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center mb-8">
            <FileQuestion className="w-10 h-10 text-purple-600 mr-3" />
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                How do I track my shipment?
              </h3>
              <p className="text-gray-600">
                Visit our <Link href="/track" className="text-purple-600 hover:underline">tracking page</Link> and enter your tracking code. You'll see real-time updates on your shipment's location and status.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                How do I reset my password?
              </h3>
              <p className="text-gray-600">
                Go to the login page and click "Forgot Password". Follow the instructions sent to your email to reset your password securely.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                What shipping options do you offer?
              </h3>
              <p className="text-gray-600">
                We offer Express Shipping, Freight Services, International Shipping, and Supply Chain Solutions. Visit our services page for detailed information.
              </p>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                How do I update my account information?
              </h3>
              <p className="text-gray-600">
                Log in to your dashboard and navigate to Profile Settings. You can update your personal information, contact details, and preferences there.
              </p>
            </div>

            <div className="pb-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                What are your response times?
              </h3>
              <p className="text-gray-600">
                We aim to respond to all inquiries within 24-48 hours. For urgent matters, please call our phone support line for immediate assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="mt-16 bg-linear-to-r from-purple-100 to-orange-100 p-10 rounded-2xl">
          <div className="flex items-center mb-6">
            <Clock className="w-10 h-10 text-purple-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">We Value Your Feedback</h2>
          </div>
          <p className="text-gray-700 mb-6 text-lg">
            Help us improve our services by sharing your experience. Your feedback matters to us and helps us serve you better.
          </p>
          <a
          href="/feedbacks"
            // href="mailto:support@shiptrackglobal.com?subject=Feedback"
            className="inline-block px-8 py-3 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-700 transition shadow-lg"
          >
            Submit Feedback
          </a>
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
            <Link href="/policy" className="text-gray-400 hover:text-white transition">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}