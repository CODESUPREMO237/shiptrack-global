import './globals.css'
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import VisitorTracker from '@/components/VisitorTracker';

export const metadata = {
  title: 'ShipTrack Global — Worldwide Shipping & Logistics',
  description: 'Track your shipments in real-time with ShipTrack Global. Fast delivery, global coverage, and 24/7 support for all your shipping needs.',
   icons: {
    icon: '/logo/mark-modern.svg',
    apple: '/logo/mark-modern.svg',
  },
}



export default function RootLayout({ children }) {
  return (
    <html lang="en">
        
      {/* 🔑 Fix for Hydration Mismatch Error caused by browser extensions */}
      <body suppressHydrationWarning={true}>
        <VisitorTracker />
        {children}
        <Footer />
        <CookieConsent />
      </body>
    </html>
  )
}
