import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/user';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (requiredRole) {
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'admin': 2,
      'super-admin': 3
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      router.push('/unauthorized');
      return null;
    }
  }

  return <>{children}</>;
} 