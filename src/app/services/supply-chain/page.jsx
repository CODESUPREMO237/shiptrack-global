
// ============================================
// FILE: src/app/services/supply-chain/page.jsx
// ============================================
"use client"
import React from 'react';
import { Box, Truck, Package, TrendingUp, Users, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import ChatWidget from "@/components/ChatWidget";
import Navbar from "@/components/Navbar";
export default function SupplyChainPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Hero Section */}
      <div className="relative bg-[#FF6A13] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">End-to-End Solutions</span>
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">Supply Chain Solutions</h1>
              <p className="text-xl mb-8 text-orange-100">End-to-end logistics management for seamless operations</p>
              <div className="flex gap-4">
                <button className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition">
                  Consult Expert
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                  View Services
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6">Complete Solutions</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Box className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Warehousing</h4>
                      <p className="text-sm text-orange-100">Strategic storage solutions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Distribution</h4>
                      <p className="text-sm text-orange-100">Efficient delivery networks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Analytics</h4>
                      <p className="text-sm text-orange-100">Data-driven insights</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solutions Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Integrated Logistics Services</h2>
          <p className="text-xl text-gray-600">Optimize your entire supply chain</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: <Box className="w-8 h-8" />, title: "Warehousing", desc: "State-of-the-art facilities with advanced inventory management" },
            { icon: <Truck className="w-8 h-8" />, title: "Distribution", desc: "Multi-channel distribution and fulfillment services" },
            { icon: <Package className="w-8 h-8" />, title: "Packaging", desc: "Custom packaging solutions and kitting services" },
            { icon: <TrendingUp className="w-8 h-8" />, title: "Analytics", desc: "Real-time visibility and performance metrics" },
            { icon: <Users className="w-8 h-8" />, title: "Consulting", desc: "Strategic supply chain optimization" },
            { icon: <Shield className="w-8 h-8" />, title: "Risk Management", desc: "Proactive supply chain risk mitigation" }
          ].map((solution, idx) => (
            <div key={idx} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="bg-orange-100 text-orange-600 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                {solution.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{solution.title}</h3>
              <p className="text-gray-600">{solution.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Transform Your Supply Chain</h2>
              <p className="text-lg text-gray-600 mb-8">
                Our integrated solutions help businesses reduce costs, improve efficiency, and scale operations globally.
              </p>
              <ul className="space-y-4">
                {[
                  "Reduce operational costs by up to 30%",
                  "Improve delivery times and accuracy",
                  "Scale seamlessly with business growth",
                  "Real-time visibility across operations",
                  "Dedicated account management"
                ].map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-orange-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Success Metrics</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-900">On-Time Delivery</span>
                    <span className="font-bold text-orange-600">99.5%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3">
                    <div className="bg-[#FF6A13] h-3 rounded-full" style={{width: '99.5%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-900">Cost Reduction</span>
                    <span className="font-bold text-orange-600">30%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3">
                    <div className="bg-[#FF6A13] h-3 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-900">Customer Satisfaction</span>
                    <span className="font-bold text-orange-600">98%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3">
                    <div className="bg-[#FF6A13] h-3 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ChatWidget />
      </div>

      {/* CTA Section */}
      <div className="bg-[#FF6A13] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Supply Chain?</h2>
              <p className="text-xl text-orange-100">Let our experts design a custom solution for your business</p>
            </div>
            <div className="flex gap-4 justify-end">
              <button className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-50 transition inline-flex items-center gap-2">
                Schedule Consultation <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}