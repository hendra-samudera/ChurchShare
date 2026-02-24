/**
 * authService.js
 * Authentication service for ChurchShare admin
 * Handles login, logout, and session management
 */

import api from '../config/api';

const TOKEN_KEY = 'churchshare_token';
const USER_KEY = 'churchshare_user';

/**
 * Store authentication data in httpOnly cookie context
 * Note: Token is stored by axios interceptor via httpOnly cookie from backend
 * We store user data for display purposes only
 */
const storeAuth = (token, user) => {
  try {
    // Token is stored in httpOnly cookie by backend
    // We only store user info for UI display
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing auth:', error);
  }
};

/**
 * Clear authentication data
 */
const clearAuth = () => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};

/**
 * Get stored user data
 */
const getStoredUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Login with email and password
 * @param {Object} credentials - Email and password
 * @param {boolean} rememberMe - Whether to extend session (30 days vs 8 hours)
 * @returns {Promise<Object>} Login result with user data
 */
export const login = async (credentials, rememberMe = true) => {
  try {
    const response = await api.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
      rememberMe,
    });

    const { user } = response.data;

    // Store user data for UI (token is in httpOnly cookie)
    storeAuth(response.headers['authorization'], user);

    return {
      success: true,
      user,
    };
  } catch (error) {
    const message = error?.response?.data?.message || 
                    error?.message || 
                    'Login failed. Please check your email and password.';
    
    return {
      success: false,
      error: message,
    };
  }
};

/**
 * Logout and clear session
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    // Always clear local state even if server request fails
  } finally {
    clearAuth();
  }
};

/**
 * Verify current session
 * @returns {Promise<Object>} Verification result
 */
export const verifySession = async () => {
  try {
    const response = await api.get('/auth/verify');
    return {
      valid: true,
      user: response.data.user,
    };
  } catch (error) {
    clearAuth();
    return {
      valid: false,
      error: error?.message || 'Session expired',
    };
  }
};

/**
 * Get current user from storage
 */
export const getCurrentUser = getStoredUser;

/**
 * Check if user is authenticated (synchronous check)
 */
export const isAuthenticated = () => {
  // Since we use httpOnly cookies, we check if user data exists
  // The actual auth check happens via API verify endpoint
  return !!localStorage.getItem(USER_KEY);
};

export default {
  login,
  logout,
  verifySession,
  getCurrentUser,
  isAuthenticated,
};
