import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireShop?: boolean;
}

const ProtectedRoute = ({ children, requireShop = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { currentShop, loading: shopLoading } = useShop();

  if (authLoading || shopLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireShop && !currentShop) {
    return <Navigate to="/shops" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
