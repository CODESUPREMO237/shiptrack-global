'use client';
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const REVIEWS = [
  { name: "James Okafor", location: "Lagos, Nigeria", message: "My package arrived in perfect condition! The tracking updates were spot on the whole time. Huge thanks to the entire team! 🎉" },
  { name: "Maria Gonzalez", location: "Mexico City, Mexico", message: "I was nervous shipping internationally but ShipTrack made it seamless. Delivered 2 days early! Thank you so much! 🙌" },
  { name: "David Chen", location: "Toronto, Canada", message: "Best delivery experience I've ever had. Package was handled with care and arrived exactly when promised. Absolutely love this service!" },
  { name: "Aisha Kamara", location: "Accra, Ghana", message: "From pickup to delivery, everything was perfect. The real-time tracking gave me total peace of mind. Will definitely use again! ❤️" },
  { name: "Luca Bianchi", location: "Rome, Italy", message: "Incredible service! My fragile items arrived without a scratch. The team clearly takes their job seriously. Grazie mille! 🇮🇹" },
  { name: "Sophie Martin", location: "Paris, France", message: "I've used many couriers before but none compare to ShipTrack. Professional, fast, and reliable. Merci beaucoup! 💯" },
  { name: "Ahmed Hassan", location: "Cairo, Egypt", message: "Delivered my package across continents without any issues. The customer support was also top-notch. Highly recommended! ⭐⭐⭐⭐⭐" },
  { name: "Priya Sharma", location: "Mumbai, India", message: "The tracking system is so accurate! I knew exactly where my package was at every step. Amazing work team! 🔥" },
  { name: "Carlos Mendez", location: "Bogotá, Colombia", message: "Super fast delivery and everything arrived in perfect shape. The ShipTrack team really outdid themselves. Thank you!! 👏" },
  { name: "Yuki Tanaka", location: "Tokyo, Japan", message: "I was impressed by the speed and accuracy. My package came earlier than expected and in mint condition. 5 stars all the way!" },
  { name: "Fatima Al-Rashid", location: "Dubai, UAE", message: "Outstanding service from start to finish. Real-time notifications kept me informed every step of the way. Truly exceptional! 🌟" },
  { name: "Kwame Asante", location: "Kumasi, Ghana", message: "My international shipment was handled perfectly. I'm beyond impressed with the professionalism. Keep up the great work! 💪" },
  { name: "Elena Volkov", location: "Moscow, Russia", message: "Delivered safely, on time, and with great care. ShipTrack has earned a loyal customer for life. Thank you so much!" },
  { name: "Michael O'Brien", location: "Dublin, Ireland", message: "Brilliant service! Tracked my parcel all the way from the US and it arrived in perfect condition. Could not be happier! ☘️" },
  { name: "Nadia Petrov", location: "Warsaw, Poland", message: "The delivery was faster than I expected. The entire experience was smooth and stress-free. Really grateful to the whole team!" },
  { name: "Emmanuel Diallo", location: "Dakar, Senegal", message: "Fantastique service! My package arrived safe and on time. The live tracking feature is a game-changer. Merci! 🇸🇳" },
  { name: "Sarah Williams", location: "London, UK", message: "Ordered something fragile and it arrived perfectly wrapped and on time. ShipTrack is the gold standard for delivery! 🏆" },
  { name: "Raj Patel", location: "Ahmedabad, India", message: "Super impressed! The package was tracked at every checkpoint and delivered with a smile. Will use again and again! 😊" },
  { name: "Grace Osei", location: "Accra, Ghana", message: "I've been using ShipTrack for my small business and it never disappoints. Fast, reliable, and affordable. Thank you team! 💼" },
  { name: "Marco Rossi", location: "Milan, Italy", message: "Everything was perfect — from booking to delivery. The team clearly cares about their customers. Highly recommend! 🙏" },
  { name: "Amara Diop", location: "Abidjan, Ivory Coast", message: "My package traveled thousands of miles and arrived in pristine condition. This team is incredible! Thank you ShipTrack! 🌍" },
  { name: "Linda Thompson", location: "New York, USA", message: "I track all my business shipments through ShipTrack and have never been let down. The reliability is unmatched! 🇺🇸" },
  { name: "Hassan Okonkwo", location: "Abuja, Nigeria", message: "Delivered right to my doorstep ahead of schedule. The notifications were helpful and very timely. Great job team! 👍" },
  { name: "Mei Lin", location: "Shanghai, China", message: "Fast, safe, and professional. My package came intact and on time. ShipTrack is my go-to shipping company from now on! 🎊" },
  { name: "Isabella Santos", location: "São Paulo, Brazil", message: "I was skeptical about international shipping but ShipTrack proved me wrong. Flawless from start to finish! Muito obrigada! 🇧🇷" },
  { name: "Patrick Nwosu", location: "Port Harcourt, Nigeria", message: "Absolutely blown away by the service. Package arrived safe and sound. The tracking updates are incredibly accurate. Thank you! 🚀" },
  { name: "Zara Ahmed", location: "Karachi, Pakistan", message: "My parcel arrived two days earlier than expected! Brilliant service and very helpful customer support. Highly recommended! ⭐" },
  { name: "François Leblanc", location: "Montreal, Canada", message: "Magnifique service! Everything was handled professionally and my package arrived in perfect condition. Merci ShipTrack! 🍁" },
  { name: "Oluwaseun Adeyemi", location: "Ibadan, Nigeria", message: "The best shipping service I have ever used. Transparent tracking and timely delivery every single time. God bless the team! 🙏" },
  { name: "Anna Kowalski", location: "Krakow, Poland", message: "I shipped some fragile glassware and it arrived without a single crack. The packaging and care was outstanding. Thank you! 💎" },
  { name: "Kevin Mensah", location: "Accra, Ghana", message: "ShipTrack never disappoints. My package came on time, perfectly wrapped. The whole team deserves a standing ovation! 👏👏" },
  { name: "Valentina Cruz", location: "Buenos Aires, Argentina", message: "Such an amazing experience! The live tracking kept me calm throughout. My package arrived exactly as described. Thank you! 🌟" },
  { name: "Daniel Ochieng", location: "Nairobi, Kenya", message: "From Kenya to the UK with zero hassle. ShipTrack handled everything perfectly. I am beyond satisfied. Asante sana! 🇰🇪" },
  { name: "Tomoko Yamamoto", location: "Osaka, Japan", message: "I've recommended ShipTrack to all my friends. The reliability and speed are unbeatable. My package arrived in perfect order!" },
  { name: "Blessing Eze", location: "Enugu, Nigeria", message: "I was worried about my first international shipment but ShipTrack made it so easy. Delivered safe and sound! Thank you! 🎁" },
  { name: "Stefan Müller", location: "Berlin, Germany", message: "Fantastic logistics service. Very transparent tracking and the delivery was right on schedule. Will definitely use again! 🇩🇪" },
  { name: "Chidinma Okeke", location: "Lagos, Nigeria", message: "My package came earlier than promised and in perfect condition. ShipTrack's team is truly world-class. Thank you so much! 🥰" },
  { name: "Ravi Kumar", location: "Chennai, India", message: "Exceptional service! The real-time tracking gave me confidence throughout the journey. My package was delivered safely! 🙌" },
  { name: "Adaeze Eze", location: "Owerri, Nigeria", message: "Smooth, professional, and fast. ShipTrack delivered my parcel with zero issues. I'm truly grateful to the entire team! ❤️" },
  { name: "Lucas Ferreira", location: "Lisbon, Portugal", message: "Absolutely fantastic experience. The tracking was accurate to the minute and my package arrived in great shape. Obrigado! 🇵🇹" },
  { name: "Ngozi Chukwu", location: "Onitsha, Nigeria", message: "My items arrived perfectly packed and right on schedule. The professionalism shown by ShipTrack is second to none. Thank you! 💯" },
  { name: "Hana Kimura", location: "Seoul, South Korea", message: "Impressive delivery speed and the package was in mint condition. ShipTrack has won a loyal customer. 감사합니다! 🇰🇷" },
  { name: "Emeka Ibe", location: "Kano, Nigeria", message: "I shipped medical equipment and it arrived safely and on time. I couldn't be more relieved and grateful. Thank you ShipTrack!" },
  { name: "Claudia Reyes", location: "Santiago, Chile", message: "Excellent service from beginning to end. The tracking notifications were timely and helpful. Muchas gracias to the team! 🇨🇱" },
  { name: "Tunde Bakare", location: "Lagos, Nigeria", message: "ShipTrack is the real deal! My package traveled halfway around the world and arrived in flawless condition. Truly amazing! 🌏" },
  { name: "Nina Johansson", location: "Stockholm, Sweden", message: "Couldn't be happier with my delivery! Everything arrived on time and perfectly intact. ShipTrack is now my number one choice!" },
  { name: "Olu Adebayo", location: "Abuja, Nigeria", message: "Fast, reliable, and professional. My package arrived a day early! ShipTrack has truly raised the bar for logistics. Thank you! 🚚" },
  { name: "Fatou Diallo", location: "Conakry, Guinea", message: "Incredible service! My parcel crossed borders without any issues. The team was responsive and helpful throughout. Merci! 🙏" },
  { name: "John Adekunle", location: "Lagos, Nigeria", message: "I run an e-commerce store and ShipTrack has been a lifesaver. Every delivery is smooth and my customers are happy! 💼🔥" },
  { name: "Amina Yusuf", location: "Kano, Nigeria", message: "I was amazed at how fast and safe my package arrived. ShipTrack exceeded every expectation I had. Highly recommend! ⭐⭐⭐⭐⭐" },
];

export default function ReviewToast() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [animatingIn, setAnimatingIn] = useState(false);
  const [review, setReview] = useState(null);
  const usedIndexesRef = useRef([]);

  // Don't render on admin pages
  if (pathname?.startsWith('/admin')) return null;

  const getNextReview = () => {
    let available = REVIEWS.map((_, i) => i).filter(i => !usedIndexesRef.current.includes(i));
    if (available.length === 0) {
      usedIndexesRef.current = [];
      available = REVIEWS.map((_, i) => i);
    }
    const pick = available[Math.floor(Math.random() * available.length)];
    usedIndexesRef.current = [...usedIndexesRef.current, pick];
    return REVIEWS[pick];
  };

  const showToast = () => {
    const next = getNextReview();
    setReview(next);
    setVisible(true);

    // Trigger slide-in on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimatingIn(true));
    });

    // Slide out after 5s
    setTimeout(() => {
      setAnimatingIn(false);
      // Remove from DOM after exit animation completes
      setTimeout(() => setVisible(false), 600);
    }, 5000);
  };

  useEffect(() => {
    // First toast after 3 seconds
    const initial = setTimeout(showToast, 3000);

    // Then every 30 seconds (30000ms gap + 600ms exit + buffer)
    const interval = setInterval(showToast, 33000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  if (!visible || !review) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-3 pt-2 pointer-events-none"
      style={{
        transform: animatingIn ? 'translateY(0px)' : 'translateY(-120%)',
        opacity: animatingIn ? 1 : 0,
        transition: animatingIn
          ? 'transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.4s ease'
          : 'transform 0.5s ease-in, opacity 0.4s ease',
      }}
    >
      <div className="pointer-events-auto bg-white border border-green-100 shadow-2xl rounded-2xl px-4 py-3 flex items-start gap-3 max-w-md w-full">
        {/* Avatar circle */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          {review.name.charAt(0)}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="font-semibold text-gray-900 text-sm leading-tight">{review.name}</span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-gray-400 text-xs">{review.location}</span>
            <span className="text-yellow-400 text-xs ml-auto tracking-tight">★★★★★</span>
          </div>
          <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{review.message}</p>
        </div>

        {/* Package icon */}
        <div className="flex-shrink-0 bg-green-50 rounded-full p-1.5 mt-0.5">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
