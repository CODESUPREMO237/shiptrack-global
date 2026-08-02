"use client";
import { useState } from "react";
  import ChatWidget from "@/components/ChatWidget";



import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: "", email: "", feedback: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSubmitted(false);

    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Failed to send");

      setSubmitted(true);
      setForm({ name: "", email: "", feedback: "" });
    } catch (err) {
      setError(err.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showFullNav={true} />
      
      {/* Hero Section */}
      <div className="bg-linear-to-r from-purple-600 to-orange-500 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold mb-4">Send Us Feedback</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Your feedback helps us improve our services. Let us know how we're doing!
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto py-12 px-5">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
            Drop us a message 💬
          </h2>

          {submitted && (
            <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg font-medium border border-green-200">
              Feedback sent successfully! Thank you.
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg font-medium border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
              <input
                required
                placeholder="John Doe"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                required
                type="email"
                placeholder="john@example.com"
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Your Feedback</label>
              <textarea
                required
                placeholder="Tell us what you think..."
                className="w-full border border-gray-300 rounded-lg p-3 h-32 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-y"
                value={form.feedback}
                onChange={(e) => setForm({ ...form, feedback: e.target.value })}
              />
            </div>

            <button
              disabled={loading}
              className="w-full px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition shadow-md flex justify-center items-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : (
                "Send Feedback"
              )}
            </button>
          </form>
        </div>
      </div>

      <ChatWidget />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
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
