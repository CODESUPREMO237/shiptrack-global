
// ============================================
// FILE: src/app/services/express/page.jsx
// ============================================
"use client"
import React from 'react';
import { Package, Clock, Shield, Zap, MapPin, Phone, CheckCircle, ArrowRight } from 'lucide-react';
import ChatWidget from "@/components/ChatWidget";
import Navbar from "@/components/Navbar";

export default function ExpressPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Hero Section */}
      <div className="relative bg-[#4D148C] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Zap className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Lightning Fast Delivery</span>
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">Express Shipping</h1>
              <p className="text-xl mb-8 text-purple-100">Fast delivery for urgent shipments with guaranteed time-definite service</p>
              <div className="flex gap-4">
                <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition">
                  Get Quote
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                  Learn More
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Same-Day Delivery</h3>
                      <p className="text-purple-100 text-sm">Available in major cities</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">100% Insured</h3>
                      <p className="text-purple-100 text-sm">Full coverage protection</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Real-Time Tracking</h3>
                      <p className="text-purple-100 text-sm">24/7 shipment visibility</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Express?</h2>
          <p className="text-xl text-gray-600">Speed, reliability, and peace of mind for your urgent shipments</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Zap className="w-8 h-8" />, title: "Next-Day Delivery", desc: "Guaranteed delivery within 24 hours to major destinations" },
            { icon: <Clock className="w-8 h-8" />, title: "Time-Definite", desc: "Choose your delivery time window with precision" },
            { icon: <Shield className="w-8 h-8" />, title: "Priority Handling", desc: "Your shipments receive top priority at every step" },
            { icon: <MapPin className="w-8 h-8" />, title: "Door-to-Door", desc: "Pickup and delivery right to your specified location" },
            { icon: <Phone className="w-8 h-8" />, title: "24/7 Support", desc: "Round-the-clock customer service and tracking" },
            { icon: <CheckCircle className="w-8 h-8" />, title: "99.9% On-Time", desc: "Industry-leading on-time delivery performance" }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="bg-purple-100 text-purple-600 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
        <ChatWidget />
      </div>

      {/* CTA Section */}
      <div className="bg-[#4D148C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Ship?</h2>
          <p className="text-xl mb-8 text-purple-100">Get instant quotes and schedule pickups online</p>
          <button className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-50 transition inline-flex items-center gap-2">
            Start Shipping <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}