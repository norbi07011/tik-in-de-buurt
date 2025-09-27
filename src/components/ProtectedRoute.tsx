import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../../pages/AuthPage';
import LoadingBar from '../../components/common/LoadingBar';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireBusiness?: boolean;
  requireFreelancer?: boolean;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireBusiness = false,
  requireFreelancer = false,
  fallback = <AuthPage />
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingBar />;
  }

  // If auth is not required, always render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  // If business role is required but user doesn't have businessId
  if (requireBusiness && user && !user.businessId) {
    return <>{fallback}</>;
  }

  // If freelancer role is required but user doesn't have freelancerId
  if (requireFreelancer && user && !user.freelancerId) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};