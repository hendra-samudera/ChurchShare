/**
 * ChurchShare API Configuration
 * Axios instance with JWT authentication and error handling
 * 
 * Note: JWT tokens are stored in httpOnly cookies by the backend.
 * This axios instance automatically includes credentials with requests.
 */

import axios from 'axios';

// Base URL - reads from environment variable or defaults to local development
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/**
 * Create axios instance with default configuration
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 second timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include httpOnly cookies
});

/**
 * Request Interceptor
 * Attaches JWT token to authenticated requests
 * Token is stored in httpOnly cookie, so we just ensure credentials are sent
 */
api.interceptors.request.use(
  (config) => {
    // For non-GET requests, ensure we have the content-type header
    if (config.data && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles common error scenarios with user-friendly messages
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Session expired - clear user data and redirect to login
          localStorage.removeItem('churchshare_user');
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return Promise.reject({
            type: 'auth',
            message: data?.message || 'You\'ve been logged out. Please log in again.',
          });

        case 403:
          return Promise.reject({
            type: 'forbidden',
            message: data?.message || 'You don\'t have permission to access this.',
          });

        case 404:
          return Promise.reject({
            type: 'not_found',
            message: data?.message || 'This resource doesn\'t exist. Please check the link.',
          });

        case 409:
          return Promise.reject({
            type: 'conflict',
            message: data?.message || 'This item already exists.',
          });

        case 413:
          return Promise.reject({
            type: 'file_too_large',
            message: 'This file is too large. Please use a PDF under 20MB.',
          });

        case 422:
          return Promise.reject({
            type: 'validation',
            message: data?.message || 'Please check your input and try again.',
            errors: data?.errors,
          });

        case 500:
        case 502:
        case 503:
          return Promise.reject({
            type: 'server',
            message: 'Something went wrong on our end. Please try again.',
          });

        default:
          return Promise.reject({
            type: 'unknown',
            message: data?.message || 'Something went wrong. Please try again.',
          });
      }
    }

    // Network errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        type: 'timeout',
        message: 'The request took too long. Please check your connection and try again.',
      });
    }

    if (error.code === 'ERR_NETWORK') {
      return Promise.reject({
        type: 'network',
        message: 'Cannot connect to server. Please check your internet connection.',
      });
    }

    // Default error
    return Promise.reject({
      type: 'unknown',
      message: error?.message || 'Something went wrong. Please try again.',
    });
  }
);

/**
 * Auth API endpoints
 */
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
};

/**
 * Admin Slots API endpoints
 */
export const adminSlotsAPI = {
  getAll: () => api.get('/admin/slots'),
  getById: (id) => api.get(`/admin/slots/${id}`),
  getBySlug: (slug) => api.get(`/admin/slots/slug/${slug}`),
  create: (data) => api.post('/admin/slots', data),
  update: (id, data) => api.put(`/admin/slots/${id}`, data),
  delete: (id) => api.delete(`/admin/slots/${id}`),
  toggleStatus: (id, isActive) => api.patch(`/admin/slots/${id}/status`, { isActive }),
  checkSlug: (slug) => api.get(`/admin/slots/check-slug/${slug}`),
  uploadFile: (slug, formData) =>
    api.post(`/admin/slots/${slug}/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

/**
 * Public API endpoints (no auth required)
 */
export const publicAPI = {
  getSlotBySlug: (slug) => api.get(`/public/slots/${slug}`),
  getFileBySlug: (slug) =>
    api.get(`/public/slots/${slug}/file`, {
      responseType: 'blob',
    }),
};

export default api;
