"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Settings, Shield } from "lucide-react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    functional: true, // Always on
    analytical: false,
    tracking: false,
  });

  useEffect(() => {
    // Check if user already responded
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Slight delay so the banner slides in after page load
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({
        functional: true,
        analytical: true,
        tracking: true,
        timestamp: new Date().toISOString(),
      })
    );
    setVisible(false);
  };

  const handleRejectOptional = () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({
        functional: true,
        analytical: false,
        tracking: false,
        timestamp: new Date().toISOString(),
      })
    );
    setVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({
        ...preferences,
        timestamp: new Date().toISOString(),
      })
    );
    setVisible(false);
    setShowPreferences(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-500"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Cookie Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-700 ease-out"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
        }}
      >
        <div className="bg-gray-900 border-t-2 border-purple-500 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Main Banner Content */}
            {!showPreferences ? (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="bg-purple-600/20 p-2.5 rounded-xl flex-shrink-0">
                    <Cookie className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    ShipTrack Global is using cookies
                  </h3>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm leading-relaxed max-w-5xl">
                  This website uses cookies and similar technologies
                  (collectively cookies). We use functional, analytical and
                  tracking cookies. For functional cookies we do not require your
                  consent. However, we need your consent for all optional
                  analytical and tracking cookies. You can further customize your
                  cookie preferences by clicking the &quot;Cookie
                  Preferences&quot; link in this banner, and at any time by
                  clicking the &quot;Cookie Consent&quot; link in the footer of
                  our website. For more information please see our{" "}
                  <Link
                    href="/policy"
                    className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                  >
                    Privacy Notice
                  </Link>
                  .
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors group"
                  >
                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    COOKIE PREFERENCES
                  </button>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
                    <button
                      onClick={handleRejectOptional}
                      className="px-8 py-3 border-2 border-orange-500 text-orange-400 font-bold text-sm rounded-sm hover:bg-orange-500/10 transition-all duration-300 tracking-wide"
                    >
                      REJECT OPTIONAL COOKIES
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="px-8 py-3 border-2 border-orange-500 bg-orange-500 text-white font-bold text-sm rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-all duration-300 tracking-wide"
                    >
                      ACCEPT ALL COOKIES
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Cookie Preferences Panel */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600/20 p-2.5 rounded-xl">
                      <Settings className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Cookie Preferences
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    ← Back
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Functional Cookies - Always On */}
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold text-sm">
                          Functional Cookies
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Essential for the website to function properly
                        </p>
                      </div>
                    </div>
                    <span className="text-green-400 text-xs font-bold tracking-wider bg-green-400/10 px-3 py-1 rounded-full">
                      ALWAYS ON
                    </span>
                  </div>

                  {/* Analytical Cookies */}
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <Cookie className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold text-sm">
                          Analytical Cookies
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Help us understand how visitors interact with our
                          website
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytical}
                        onChange={(e) =>
                          setPreferences((p) => ({
                            ...p,
                            analytical: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>

                  {/* Tracking Cookies */}
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <Cookie className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold text-sm">
                          Tracking Cookies
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Used to personalize content and advertisements
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.tracking}
                        onChange={(e) =>
                          setPreferences((p) => ({
                            ...p,
                            tracking: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>

                {/* Save Preferences Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    className="px-8 py-3 bg-purple-600 text-white font-bold text-sm rounded-sm hover:bg-purple-700 transition-all duration-300 tracking-wide"
                  >
                    SAVE PREFERENCES
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
