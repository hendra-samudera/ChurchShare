/**
 * ProgressBar.jsx
 * Accessible progress indicator for file uploads
 * 
 * Features:
 * - Clear percentage display
 * - High contrast colors
 * - Screen reader support
 * - Smooth animation
 * - Success/error states
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ProgressBar.css';

/**
 * ProgressBar Component
 */
const ProgressBar = ({ 
  progress, 
  label = 'Uploading...',
  showPercentage = true,
  status = 'uploading',
  size = 'large'
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Determine status class
  const statusClass = {
    uploading: 'progress-uploading',
    success: 'progress-success',
    error: 'progress-error',
  }[status] || 'progress-uploading';

  // Size class
  const sizeClass = {
    small: 'progress-small',
    medium: 'progress-medium',
    large: 'progress-large',
  }[size] || 'progress-large';

  return (
    <div 
      className={`progress-bar-container ${statusClass} ${sizeClass}`}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label={label}
    >
      {/* Progress bar track */}
      <div className="progress-bar-track">
        {/* Progress bar fill */}
        <div 
          className="progress-bar-fill"
          style={{ width: `${clampedProgress}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Progress text */}
      {showPercentage && (
        <div className="progress-bar-info">
          <span className="progress-bar-label">{label}</span>
          <span className="progress-bar-percentage">
            {clampedProgress}%
          </span>
        </div>
      )}

      {/* Status icon for completion */}
      {status === 'success' && (
        <span className="progress-bar-success-icon" aria-hidden="true">
          ✅
        </span>
      )}

      {status === 'error' && (
        <span className="progress-bar-error-icon" aria-hidden="true">
          ❌
        </span>
      )}
    </div>
  );
};

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  label: PropTypes.string,
  showPercentage: PropTypes.bool,
  status: PropTypes.oneOf(['uploading', 'success', 'error']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

ProgressBar.defaultProps = {
  label: 'Uploading...',
  showPercentage: true,
  status: 'uploading',
  size: 'large',
};

export default ProgressBar;
