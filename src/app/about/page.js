"use client";

import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";
import Navbar from "@/components/Navbar";
import { Globe, Target, Users, Rocket, Award, TrendingUp } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar showFullNav={true} />

      {/* Hero */}
      <div className="bg-[#4D148C] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Globe className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-5xl font-extrabold mb-4">About ShipTrack Global</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Revolutionizing global logistics with cutting-edge technology and customer-first service
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Company Overview */}
          <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Who We Are</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              ShipTrack Global is a leading logistics and shipment tracking platform dedicated to bringing transparency, speed, and reliability to the world of global shipping. Founded with a vision to simplify complex supply chains, we serve over 500 businesses worldwide.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Our state-of-the-art tracking technology ensures real-time visibility of shipments across air, sea, and land routes, giving our customers complete peace of mind from pickup to delivery.
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#4D148C] text-white p-8 rounded-2xl shadow-lg text-center">
              <Award className="w-12 h-12 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-purple-100">Active Clients</div>
            </div>
            <div className="bg-[#FF6A13] text-white p-8 rounded-2xl shadow-lg text-center">
              <Globe className="w-12 h-12 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-2">220+</div>
              <div className="text-orange-100">Countries Served</div>
            </div>
            <div className="bg-[#4D148C] text-white p-8 rounded-2xl shadow-lg text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-purple-100">On-Time Delivery</div>
            </div>
          </div>

          {/* Mission */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <Target className="w-10 h-10 text-purple-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              To transform global logistics by providing innovative, transparent, and efficient shipping solutions that empower businesses and individuals to move goods seamlessly across borders. We strive to eliminate the stress and uncertainty from shipping through advanced technology and exceptional customer service.
            </p>
          </div>

          {/* Values */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <Users className="w-10 h-10 text-orange-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">Our Core Values</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="w-3 h-3 bg-purple-600 rounded-full mt-2 mr-3 shrink-0"></div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Customer First</h3>
                  <p className="text-gray-600">Every decision we make prioritizes our customers' needs and satisfaction</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 mr-3 shrink-0"></div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Transparency & Trust</h3>
                  <p className="text-gray-600">Complete visibility and honest communication at every step</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-purple-600 rounded-full mt-2 mr-3 shrink-0"></div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Innovation</h3>
                  <p className="text-gray-600">Leveraging cutting-edge technology to solve complex logistics challenges</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 mr-3 shrink-0"></div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Reliability</h3>
                  <p className="text-gray-600">Consistent, dependable service you can count on every time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-purple-50 p-10 rounded-2xl border-2 border-purple-200">
            <div className="flex items-center mb-4">
              <Rocket className="w-10 h-10 text-purple-700 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">Our Vision</h2>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              To create a world where shipping is stress-free, fully connected, and accessible for everyone. We envision a future where businesses of all sizes can compete globally through seamless, efficient logistics powered by intelligent technology. Our goal is to be the most trusted name in global shipping and supply chain solutions.
            </p>
          </div>

          {/* Why Choose Us */}
          <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose ShipTrack Global?</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Global Network</h3>
                  <p className="text-gray-600">Extensive partnerships with carriers worldwide ensure your shipments reach any destination</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-orange-100 p-3 rounded-lg mr-4">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Real-Time Tracking</h3>
                  <p className="text-gray-600">Advanced GPS and IoT technology provides accurate, up-to-the-minute location updates</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">24/7 Support</h3>
                  <p className="text-gray-600">Our dedicated team is always available to assist you with any questions or concerns</p>
                </div>
              </div>
            </div>
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