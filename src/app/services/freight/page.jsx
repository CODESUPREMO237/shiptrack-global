// ============================================
// FILE: src/app/services/freight/page.jsx
// ============================================
"use client"
import React from 'react';
import { Truck, Box, Anchor, Plane, CheckCircle } from 'lucide-react';
import ChatWidget from "@/components/ChatWidget";
import Navbar from "@/components/Navbar";

export default function FreightPage() {
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
                <Truck className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Heavy-Duty Logistics</span>
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">Freight Services</h1>
              <p className="text-xl mb-8 text-blue-100">Large volume shipping solutions for businesses of all sizes</p>
              <div className="flex gap-4">
                <button className="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
                  Request Quote
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                  View Solutions
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">Shipping Modes</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Truck className="w-6 h-6" />
                    <span className="font-semibold">Full Truckload (FTL)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Box className="w-6 h-6" />
                    <span className="font-semibold">Less Than Truckload (LTL)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Anchor className="w-6 h-6" />
                    <span className="font-semibold">Ocean Freight</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Plane className="w-6 h-6" />
                    <span className="font-semibold">Air Freight</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Comprehensive Freight Solutions</h2>
          <p className="text-xl text-gray-600">Flexible options for every shipping need</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {[
            { 
              icon: <Truck className="w-10 h-10" />, 
              title: "Full Truckload (FTL)", 
              desc: "Dedicated truck for large shipments, faster transit times, and maximum security",
              features: ["10,000+ lbs capacity", "Direct delivery", "Cost-effective for volume"]
            },
            { 
              icon: <Box className="w-10 h-10" />, 
              title: "Less Than Truckload (LTL)", 
              desc: "Share truck space with other shipments for smaller loads and better rates",
              features: ["150-10,000 lbs", "Terminal consolidation", "Economical pricing"]
            },
            { 
              icon: <Anchor className="w-10 h-10" />, 
              title: "Ocean Freight", 
              desc: "International shipping via sea for large volumes and heavy cargo",
              features: ["20' & 40' containers", "FCL & LCL options", "Global port network"]
            },
            { 
              icon: <Plane className="w-10 h-10" />, 
              title: "Air Freight", 
              desc: "Fast international delivery for time-sensitive or high-value cargo",
              features: ["2-5 day delivery", "Climate controlled", "Customs clearance"]
            }
          ].map((service, idx) => (
            <div key={idx} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="bg-blue-100 text-blue-700 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-600 mb-6">{service.desc}</p>
              <ul className="space-y-2">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
<ChatWidget />
      </div>

      {/* Stats Section */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">5K+</div>
              <div className="text-blue-200">Shipments Monthly</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-blue-200">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-200">Support Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-blue-200">Countries Served</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}