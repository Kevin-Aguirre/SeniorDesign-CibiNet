import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

export default function ProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles?: User['role'][];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-surface-200 border-t-primary-500" />
          <div className="absolute inset-0 h-10 w-10 rounded-full animate-pulse" style={{ background: 'rgba(6, 182, 212, 0.1)' }} />
        </div>
        <p className="text-sm text-surface-400 font-medium">Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
