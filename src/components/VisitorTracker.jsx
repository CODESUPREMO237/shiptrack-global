'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin pages
    if (pathname?.startsWith('/admin')) return;

    const referrer = typeof document !== 'undefined' ? document.referrer : '';

    fetch('/api/visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathname, referrer }),
    }).catch(() => {}); // totally silent
  }, [pathname]);

  return null; // renders nothing
}
