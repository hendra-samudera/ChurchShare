/**
 * LoadingSpinner Component
 * Accessible loading indicator for elderly users
 * 
 * Features:
 * - Large, visible spinner (48px)
 * - Clear loading text
 * - Screen reader support
 * - Respects reduced motion preferences
 * - Optional full-screen overlay
 */

import React from 'react';
import PropTypes from 'prop-types';
import './LoadingSpinner.css';

/**
 * LoadingSpinner Component
 * @param {Object} props
 * @param {'small' | 'medium' | 'large'} props.size - Spinner size
 * @param {string} props.message - Loading message to display
 * @param {boolean} props.overlay - Show as full-screen overlay
 * @param {string} props.className - Additional CSS classes
 */
const LoadingSpinner = ({
  size = 'medium',
  message = 'Loading...',
  overlay = false,
  className = '',
}) => {
  const classes = [
    'loading-spinner',
    `loading-spinner-${size}`,
    overlay ? 'loading-spinner-overlay' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="spinner" aria-hidden="true">
        <span className="visually-hidden">Loading</span>
      </div>
      {message && (
        <span className="loading-text">{message}</span>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  message: PropTypes.string,
  overlay: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * PageLoader Component
 * Full-page loading state for page transitions
 */
export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <LoadingSpinner size="large" message={message} />
    </div>
  );
};

PageLoader.propTypes = {
  message: PropTypes.string,
};

/**
 * InlineLoader Component
 * Small inline loader for button states or inline content
 */
export const InlineLoader = ({ className = '' }) => {
  return (
    <span 
      className={`inline-loader ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="visually-hidden">Loading...</span>
    </span>
  );
};

InlineLoader.propTypes = {
  className: PropTypes.string,
};

export default LoadingSpinner;
