'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  allowedRoles 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check role-based access if specified
  // TODO: Implement role-based access control
  // Currently, the User type doesn't include role information
  // if (allowedRoles && allowedRoles.length > 0) {
  //   const userRole = user.user_metadata?.role || 'user';
  //   if (!allowedRoles.includes(userRole)) {
  //     router.push('/unauthorized');
  //     return null;
  //   }
  // }

  return <>{children}</>;
}