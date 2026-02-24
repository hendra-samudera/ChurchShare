/**
 * PageHeader Component
 * Consistent page header with back navigation for elderly users
 * 
 * Features:
 * - Large, clear back button (48x48px tap target)
 * - Prominent page title (20sp+ bold)
 * - Optional subtitle for context
 * - Optional actions area
 * - Consistent spacing across all pages
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './PageHeader.css';

/**
 * PageHeader Component
 * @param {Object} props
 * @param {string} props.title - Main page title
 * @param {string} props.subtitle - Optional subtitle/description
 * @param {boolean} props.showBack - Show back button (default: true)
 * @param {string} props.backTo - Custom back navigation path
 * @param {function} props.onBack - Custom back handler
 * @param {React.ReactNode} props.actions - Optional action buttons
 * @param {string} props.className - Additional CSS classes
 */
const PageHeader = ({
  title,
  subtitle,
  showBack = true,
  backTo,
  onBack,
  actions,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = (e) => {
    e.preventDefault();
    
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const classes = ['page-header', className].filter(Boolean).join(' ');

  return (
    <header className={classes} role="banner">
      {showBack && (
        <button
          type="button"
          className="back-button"
          onClick={handleBack}
          aria-label="Go back to previous page"
          title="Go back"
        >
          <span aria-hidden="true">←</span>
        </button>
      )}
      
      <div className="page-header-content">
        <h1 className="page-title">{title}</h1>
        
        {subtitle && (
          <p className="page-subtitle">{subtitle}</p>
        )}
      </div>
      
      {actions && (
        <div className="page-header-actions">
          {actions}
        </div>
      )}
    </header>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  showBack: PropTypes.bool,
  backTo: PropTypes.string,
  onBack: PropTypes.func,
  actions: PropTypes.node,
  className: PropTypes.string,
};

/**
 * SimpleHeader Component
 * Minimal header without back button for landing pages
 */
export const SimpleHeader = ({ 
  title, 
  subtitle, 
  logo,
  className = '' 
}) => {
  const classes = ['simple-header', className].filter(Boolean).join(' ');

  return (
    <header className={classes} role="banner">
      {logo && (
        <div className="simple-header-logo">
          {logo}
        </div>
      )}
      
      <div className="simple-header-content">
        <h1 className="simple-header-title">{title}</h1>
        
        {subtitle && (
          <p className="simple-header-subtitle">{subtitle}</p>
        )}
      </div>
    </header>
  );
};

SimpleHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  logo: PropTypes.node,
  className: PropTypes.string,
};

/**
 * AdminHeader Component
 * Header for admin dashboard with logout
 */
export const AdminHeader = ({ 
  title,
  user,
  onLogout,
  className = '' 
}) => {
  const classes = ['admin-header', className].filter(Boolean).join(' ');

  return (
    <header className={classes} role="banner">
      <div className="admin-header-content">
        <h1 className="admin-header-title">{title}</h1>
        
        {user && (
          <span className="admin-header-user">
            Welcome, {user.name || user.email}
          </span>
        )}
      </div>
      
      {onLogout && (
        <button
          type="button"
          className="admin-logout-button"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
        >
          <span aria-hidden="true">🚪</span>
          <span className="admin-logout-text">Log Out</span>
        </button>
      )}
    </header>
  );
};

AdminHeader.propTypes = {
  title: PropTypes.string.isRequired,
  user: PropTypes.object,
  onLogout: PropTypes.func,
  className: PropTypes.string,
};

export default PageHeader;
