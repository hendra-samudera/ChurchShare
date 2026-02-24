/**
 * PageIndicator Component
 * Clear, large page counter for PDF viewer
 *
 * Features:
 * - "Page X of Y" format for clarity
 * - Large, readable font (20sp+)
 * - High contrast colors
 * - Screen reader support
 *
 * Accessibility:
 * - 20sp+ font size
 * - 4.5:1+ contrast ratio
 * - aria-live for dynamic updates
 */

import React from 'react';
import PropTypes from 'prop-types';
import './PageIndicator.css';

/**
 * PageIndicator Component
 * @param {Object} props
 * @param {number} props.currentPage - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {string} props.className - Additional CSS classes
 */
const PageIndicator = ({
  currentPage,
  totalPages,
  className = '',
}) => {
  // Validate inputs
  const validCurrent = Math.max(1, Math.min(currentPage, totalPages));
  const validTotal = Math.max(1, totalPages);

  const classes = ['page-indicator', className].filter(Boolean).join(' ');

  return (
    <div 
      className={classes} 
      role="status" 
      aria-live="polite"
      aria-label={`Page ${validCurrent} of ${validTotal}`}
    >
      <span className="page-indicator-label">Page</span>
      <span className="page-indicator-current" aria-current="page">
        {validCurrent}
      </span>
      <span className="page-indicator-separator" aria-hidden="true">of</span>
      <span className="page-indicator-total">{validTotal}</span>
    </div>
  );
};

PageIndicator.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  className: PropTypes.string,
};

/**
 * CompactPageIndicator Component
 * Simplified "X / Y" format for smaller screens
 */
export const CompactPageIndicator = ({
  currentPage,
  totalPages,
  className = '',
}) => {
  const validCurrent = Math.max(1, Math.min(currentPage, totalPages));
  const validTotal = Math.max(1, totalPages);

  const classes = [
    'page-indicator',
    'page-indicator-compact',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes} 
      role="status" 
      aria-live="polite"
      aria-label={`Page ${validCurrent} of ${validTotal}`}
    >
      <span className="page-indicator-current" aria-current="page">
        {validCurrent}
      </span>
      <span className="page-indicator-separator" aria-hidden="true">/</span>
      <span className="page-indicator-total">{validTotal}</span>
    </div>
  );
};

CompactPageIndicator.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  className: PropTypes.string,
};

/**
 * ProgressBarIndicator Component
 * Visual progress bar showing reading progress
 */
export const ProgressBarIndicator = ({
  currentPage,
  totalPages,
  className = '',
}) => {
  const validCurrent = Math.max(1, Math.min(currentPage, totalPages));
  const validTotal = Math.max(1, totalPages);
  const progress = (validCurrent / validTotal) * 100;

  const classes = [
    'page-indicator',
    'page-indicator-progress',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes}
      role="progressbar"
      aria-valuenow={validCurrent}
      aria-valuemin={1}
      aria-valuemax={validTotal}
      aria-label={`Reading progress: ${Math.round(progress)}%`}
    >
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="progress-text">
        {validCurrent} of {validTotal}
      </span>
    </div>
  );
};

ProgressBarIndicator.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  className: PropTypes.string,
};

export default PageIndicator;
