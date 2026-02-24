/**
 * Button Component
 * Accessible, large tap target button for elderly users
 * 
 * Features:
 * - Minimum 48x48px tap target (56px for primary)
 * - High contrast colors
 * - Clear focus indicators
 * - Icon support with proper spacing
 * - Loading state
 * - Full width on mobile
 */

import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

/**
 * Button Component
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'danger' | 'success' | 'outline'} props.variant - Button style
 * @param {'small' | 'medium' | 'large'} props.size - Button size
 * @param {boolean} props.fullWidth - Make button full width
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.loading - Show loading state
 * @param {React.ReactNode} props.icon - Icon to display before text
 * @param {React.ReactNode} props.children - Button text
 * @param {string} props.type - HTML button type (button, submit, reset)
 * @param {function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaLabel - Accessibility label
 */
const Button = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  children,
  type = 'button',
  onClick,
  className = '',
  ariaLabel,
  ...props
}) => {
  // Build class names
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    className,
  ].filter(Boolean).join(' ');

  // Determine if button should be disabled
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      onClick={onClick}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span 
          className="btn-spinner" 
          aria-hidden="true"
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </span>
      )}
      {icon && <span className="btn-icon" aria-hidden="true">{icon}</span>}
      {children && <span className="btn-text">{children}</span>}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline', 'link']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default Button;
