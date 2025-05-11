'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InfoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the resources page immediately
    router.push('/info/resources');
  }, [router]);

  // Return empty div since the page will redirect immediately
  return <div></div>;
} 