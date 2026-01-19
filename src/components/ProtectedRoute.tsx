import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, approvalStatus, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but not approved - redirect to pending
  if (approvalStatus !== 'approved') {
    return <Navigate to="/pending-approval" replace />;
  }

  // User is approved - show the protected content
  return <>{children}</>;
}
