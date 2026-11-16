"use client";

import { useState, useEffect } from "react";

export default function ShippingCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 23;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map((num, idx) => (
        <div
          key={num}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentSlide === idx ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={`/ships/${num}.jpg`}
            alt={`Shipping ${num}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              const extensions = ['png', 'jpeg', 'webp'];
              const currentExt = e.target.src.split('.').pop();
              const nextExtIdx = extensions.indexOf(currentExt) + 1;
              if (nextExtIdx < extensions.length) {
                e.target.src = `/ships/${num}.${extensions[nextExtIdx]}`;
              }
            }}
          />
        </div>
      ))}
      
      {/* Dark overlay for text readability - REDUCED OPACITY */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Carousel indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {[...Array(totalSlides)].map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentSlide === idx
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}