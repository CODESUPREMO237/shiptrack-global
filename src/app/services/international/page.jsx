

// ============================================
// FILE: src/app/services/international/page.jsx
// ============================================
"use client"
import React from 'react';
import { Globe, Shield, MapPin, Plane, Anchor, TrendingUp, ArrowRight } from 'lucide-react';
import ChatWidget from "@/components/ChatWidget";
import Navbar from "@/components/Navbar";


export default function InternationalPage() {
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
                <Globe className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Worldwide Reach</span>
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">International Shipping</h1>
              <p className="text-xl mb-8 text-teal-100">Global delivery network connecting you to over 150 countries</p>
              <div className="flex gap-4">
                <button className="bg-white text-teal-600 px-8 py-3 rounded-lg font-semibold hover:bg-teal-50 transition">
                  Ship Internationally
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                  Track Shipment
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">Global Coverage</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-3xl font-bold mb-1">150+</div>
                    <div className="text-sm text-teal-100">Countries</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-3xl font-bold mb-1">200+</div>
                    <div className="text-sm text-teal-100">Ports</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-3xl font-bold mb-1">300+</div>
                    <div className="text-sm text-teal-100">Partners</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-3xl font-bold mb-1">24/7</div>
                    <div className="text-sm text-teal-100">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete International Solutions</h2>
          <p className="text-xl text-gray-600">From customs clearance to door delivery</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Globe className="w-8 h-8" />, title: "Customs Clearance", desc: "Expert handling of all customs documentation and procedures" },
            { icon: <Shield className="w-8 h-8" />, title: "Insurance Coverage", desc: "Comprehensive protection for international shipments" },
            { icon: <MapPin className="w-8 h-8" />, title: "Door-to-Door", desc: "Complete delivery from origin to final destination" },
            { icon: <Plane className="w-8 h-8" />, title: "Express Air", desc: "Fast international delivery via air freight" },
            { icon: <Anchor className="w-8 h-8" />, title: "Ocean Shipping", desc: "Cost-effective sea freight for large volumes" },
            { icon: <TrendingUp className="w-8 h-8" />, title: "Trade Compliance", desc: "Regulatory compliance and trade documentation" }
          ].map((service, idx) => (
            <div key={idx} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="bg-teal-100 text-teal-600 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-600">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Process Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to ship internationally</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Get Quote", desc: "Enter shipment details and get instant pricing" },
              { step: "02", title: "Book Shipment", desc: "Choose service and schedule pickup" },
              { step: "03", title: "Track Progress", desc: "Monitor your shipment in real-time" },
              { step: "04", title: "Receive Delivery", desc: "Get confirmation and proof of delivery" }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-[#4D148C] text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
<ChatWidget />
      </div>

      {/* CTA Section */}
      <div className="bg-[#4D148C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Shipping Globally Today</h2>
          <p className="text-xl mb-8 text-teal-100">Join thousands of businesses shipping worldwide</p>
          <button className="bg-white text-teal-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-teal-50 transition inline-flex items-center gap-2">
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}