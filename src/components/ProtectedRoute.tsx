import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../../pages/AuthPage';

const BUILDID = 'AU-2025-10-02-UNFREEZE-V2';
console.log('[BUILDID]', BUILDID, 'ProtectedRoute.tsx');

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
  const { isAuthenticated, user, business } = useAuth();

  console.log('[PROTECTED_ROUTE] Entry check:', {
    isAuthenticated,
    requireAuth,
    requireBusiness,
    hasBusinessId: !!user?.businessId,
    hasBusinessObj: !!business
  });

  if (requireAuth && !isAuthenticated) {
    console.warn('[PROTECTED_ROUTE_BLOCKED] reason: not authenticated');
    return fallback;
  }

  if (requireBusiness) {
    const hasBusinessId = !!user?.businessId;
    const hasBusinessObj = !!business;
    
    // Soft guard: if user has businessId but business object not yet restored, allow through with warning
    if (!hasBusinessObj && hasBusinessId) {
      console.warn('[PROTECTED_ROUTE] ⚠️ Allowing due to businessId without object (restore in progress)');
    } else if (!hasBusinessObj) {
      console.warn('[PROTECTED_ROUTE_BLOCKED] reason: no business object and no businessId');
      return fallback;
    }
  }

  console.log('[PROTECTED_ROUTE] ✅ Access granted');
  return <>{children}</>;
};