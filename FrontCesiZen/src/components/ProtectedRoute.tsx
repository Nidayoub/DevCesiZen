'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/user';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!loading && !isAuthenticated) {
      router.push(redirectTo);
    }
    
    if (!loading && requiredRole && user) {
      const roleHierarchy: Record<UserRole, number> = {
        'user': 1,
        'admin': 2,
        'super-admin': 3
      };

      if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
        router.push('/unauthorized');
      }
    }
  }, [loading, isAuthenticated, isInitialized, requiredRole, user, router, redirectTo]);

  if (!isInitialized || loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user) {
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'admin': 2,
      'super-admin': 3
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      return null;
    }
  }

  return <>{children}</>;
} 