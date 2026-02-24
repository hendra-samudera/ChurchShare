/**
 * ProtectedRoute.jsx
 * Route wrapper that requires authentication
 * Redirects to login if not authenticated
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageLoader from '../common/LoadingSpinner';

/**
 * ProtectedRoute Component
 * Wraps admin routes that require authentication
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth status
  if (isLoading) {
    return <PageLoader message="Checking login..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Render children if authenticated
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * PublicRoute Component
 * Redirects to dashboard if already authenticated
 * Used for login page
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth status
  if (isLoading) {
    return <PageLoader message="Checking login..." />;
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Render children if not authenticated
  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
