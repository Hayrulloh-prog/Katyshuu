import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import Header from './Header';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();// Use useMemo to prevent infinite re-renders
  const roleCheckResult = useMemo(() => {
  if (loading) {    return {
        isAllowed: false,
        isRedirecting: true,
        component: (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)] pt-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
              </div>
            </div>
          </div>
        )
      };
    }  if (!user) {    return {
        isAllowed: false,
        isRedirecting: true,
        component: <Navigate to="/login" replace />
      };
    }  if (requiredRole) {
      // Normalize roles - handle both camelCase and UPPER_CASE
      let normalizedUserRole = user?.role?.toUpperCase() || '';    // Convert camelCase to UPPER_CASE (superAdmin -> SUPER_ADMIN)
      if (normalizedUserRole === 'SUPERADMIN') {
        normalizedUserRole = 'SUPER_ADMIN';
      }    // Also handle the original camelCase
      if (user?.role === 'superAdmin') {
        normalizedUserRole = 'SUPER_ADMIN';
      }    const normalizedRequiredRole = requiredRole.toUpperCase();

    if (normalizedUserRole !== normalizedRequiredRole) {      return {
          isAllowed: false,
          isRedirecting: true,
          component: <Navigate to="/login" replace />
        };
      }
    }
  return {
      isAllowed: true,
      isRedirecting: false,
      component: children
    };
  }, [user, loading, requiredRole, t]);return roleCheckResult.component;
};

export default ProtectedRoute;
