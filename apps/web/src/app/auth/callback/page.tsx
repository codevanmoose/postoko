'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { Container } from '@/components/layout/container';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The auth state change listener in AuthProvider will handle the session
    // We just need to wait a moment and redirect
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Container size="sm" className="text-center">
        <Spinner size="lg" className="mb-4" />
        <p className="text-muted-foreground">Signing you in...</p>
      </Container>
    </main>
  );
}