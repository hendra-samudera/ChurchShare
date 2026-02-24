/**
 * ErrorMessage Component
 * User-friendly error display for elderly users
 * 
 * Features:
 * - Plain language messages (no technical jargon)
 * - Clear visual indication with icon
 * - High contrast colors
 * - Optional retry action
 * - Screen reader friendly
 */

import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import './ErrorMessage.css';

/**
 * Error message type configurations
 */
const errorConfig = {
  default: {
    icon: '⚠️',
    title: 'Something went wrong',
  },
  network: {
    icon: '📡',
    title: 'Connection problem',
  },
  not_found: {
    icon: '🔍',
    title: 'Page not found',
  },
  auth: {
    icon: '🔐',
    title: 'Login required',
  },
  forbidden: {
    icon: '🚫',
    title: 'Access denied',
  },
  file_too_large: {
    icon: '📁',
    title: 'File too large',
  },
  server: {
    icon: '🖥️',
    title: 'Server error',
  },
  timeout: {
    icon: '⏱️',
    title: 'Request timed out',
  },
  upload: {
    icon: '📤',
    title: 'Upload failed',
  },
  pdf: {
    icon: '📄',
    title: 'Could not load document',
  },
};

/**
 * ErrorMessage Component
 * @param {Object} props
 * @param {string} props.type - Error type for icon/title
 * @param {string} props.message - User-friendly error message
 * @param {string} props.title - Override default title
 * @param {function} props.onRetry - Optional retry handler
 * @param {string} props.retryLabel - Custom retry button text
 * @param {boolean} props.inline - Display inline vs card style
 * @param {string} props.className - Additional CSS classes
 */
const ErrorMessage = ({
  type = 'default',
  message,
  title,
  onRetry,
  retryLabel = 'Try Again',
  inline = false,
  className = '',
}) => {
  const config = errorConfig[type] || errorConfig.default;
  const displayTitle = title || config.title;
  const displayIcon = config.icon;

  const classes = [
    'error-message',
    inline ? 'error-message-inline' : 'error-message-card',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-message-icon" aria-hidden="true">
        {displayIcon}
      </div>
      
      <div className="error-message-content">
        <h3 className="error-message-title">
          {displayTitle}
        </h3>
        
        {message && (
          <p className="error-message-text">
            {message}
          </p>
        )}
        
        {onRetry && (
          <div className="error-message-actions">
            <Button 
              variant="primary" 
              onClick={onRetry}
              aria-label={`Retry: ${displayTitle}`}
            >
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  type: PropTypes.oneOf([
    'default',
    'network',
    'not_found',
    'auth',
    'forbidden',
    'file_too_large',
    'server',
    'timeout',
    'upload',
    'pdf',
  ]),
  message: PropTypes.string,
  title: PropTypes.string,
  onRetry: PropTypes.func,
  retryLabel: PropTypes.string,
  inline: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * FormError Component
 * Inline error for form fields
 */
export const FormError = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div 
      className={`form-error ${className}`}
      role="alert"
    >
      <span className="form-error-icon" aria-hidden="true">⚠</span>
      <span className="form-error-text">{message}</span>
    </div>
  );
};

FormError.propTypes = {
  message: PropTypes.string,
  className: PropTypes.string,
};

/**
 * AlertError Component
 * Banner-style error for page-level errors
 */
export const AlertError = ({ 
  message, 
  onDismiss, 
  className = '' 
}) => {
  return (
    <div 
      className={`alert-error ${className}`}
      role="alert"
    >
      <span className="alert-error-icon" aria-hidden="true">⚠️</span>
      <span className="alert-error-text">{message}</span>
      {onDismiss && (
        <button
          className="alert-error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error message"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
};

AlertError.propTypes = {
  message: PropTypes.string.isRequired,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
};

export default ErrorMessage;
