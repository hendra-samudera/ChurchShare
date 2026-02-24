/**
 * useAuth Hook
 * Manages admin authentication state
 * Works with authService for login/logout operations
 */

import { useState, useEffect, useCallback } from 'react';
import { verifySession, getCurrentUser, logout as logoutService } from '../services/authService';

/**
 * useAuth Hook
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Verify existing session on mount
   */
  useEffect(() => {
    const verifySessionOnMount = async () => {
      // Check if we have stored user data
      const storedUser = getCurrentUser();
      
      if (!storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await verifySession();
        
        if (result.valid) {
          setIsAuthenticated(true);
          setUser(result.user || storedUser);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySessionOnMount();
  }, []);

  /**
   * Listen for logout events from API interceptor
   */
  useEffect(() => {
    const handleLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  /**
   * Login with credentials
   * Note: This is now handled in LoginPage using authService directly
   * Kept for backward compatibility
   */
  const login = useCallback(async (credentials) => {
    // Login is now handled by authService.login() in LoginPage
    // This is kept for backward compatibility
    setError(null);
    setIsLoading(true);

    try {
      // Import dynamically to avoid circular dependency
      const { login: authServiceLogin } = await import('../services/authService');
      const result = await authServiceLogin(credentials);

      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (err) {
      const errorMessage = err?.message || 'Login failed. Please check your email and password.';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async () => {
    await logoutService();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isAuthenticated,
    user,
    isLoading,
    error,

    // Actions
    login,
    logout,
    clearError,
  };
};

/**
 * Helper function to check if user is authenticated (synchronous)
 * Useful for route guards
 */
export const isAuthenticated = () => {
  return !!getCurrentUser();
};

/**
 * Helper function to get current user (synchronous)
 */
export const getCurrentUserSync = getCurrentUser;

export default useAuth;
