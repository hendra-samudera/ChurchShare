/**
 * ChurchShare App
 * Main application with routing and error boundary
 *
 * Routes:
 * - /view/:slug (public PDF viewer)
 * - /admin/login (admin login)
 * - /admin/dashboard (admin slot management)
 * - /admin/slots/new (create slot)
 * - /admin/slots/:slug/upload (upload to slot)
 * - /admin/slots/:slug/success (upload success)
 */

import React, { Suspense } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageLoader } from './components/common/LoadingSpinner';
import ProtectedRoute, { PublicRoute } from './components/admin/ProtectedRoute';
import './index.css';

// Lazy load pages for better initial load performance
const ViewerPage = React.lazy(() => import('./pages/ViewerPage'));
const LoginPage = React.lazy(() => import('./pages/admin/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/admin/DashboardPage'));
const NewSlotPage = React.lazy(() => import('./pages/admin/NewSlotPage'));
const UploadPage = React.lazy(() => import('./pages/admin/UploadPage'));
const SuccessPage = React.lazy(() => import('./pages/admin/SuccessPage'));

/**
 * Create React Query client
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly message
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <div className="error-boundary-content">
            <span className="error-boundary-icon" aria-hidden="true">⚠️</span>
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-text">
              We're sorry, but something unexpected happened.
              Please try refreshing the page.
            </p>
            <button
              className="error-boundary-button btn btn-primary"
              onClick={this.handleRetry}
              type="button"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Loading fallback for lazy-loaded components
 */
const RouteLoader = () => (
  <div className="route-loader">
    <PageLoader message="Loading page..." />
  </div>
);

/**
 * Main App Component
 */
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="app">
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/"
                  element={<Navigate to="/view/welcome" replace />}
                />
                <Route
                  path="/view/:slug"
                  element={<ViewerPage />}
                />
                <Route
                  path="/view/welcome"
                  element={<ViewerPage />}
                />

                {/* Admin Routes - Public (login) */}
                <Route
                  path="/admin/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />

                {/* Admin Routes - Protected */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/slots/new"
                  element={
                    <ProtectedRoute>
                      <NewSlotPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/slots/:slug/upload"
                  element={
                    <ProtectedRoute>
                      <UploadPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/slots/:slug/success"
                  element={
                    <ProtectedRoute>
                      <SuccessPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Route - Redirect to welcome page */}
                <Route
                  path="*"
                  element={
                    <Navigate to="/view/welcome" replace />
                  }
                />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
