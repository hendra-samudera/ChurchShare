/**
 * ViewerControls Component
 * Large, touch-friendly controls for PDF viewer
 *
 * Features:
 * - Page navigation (previous/next)
 * - Zoom controls (in/out/reset)
 * - Minimum 48x48px tap targets
 * - High contrast, clear labels
 * - Disabled state for boundary conditions
 *
 * Accessibility:
 * - 48x48dp minimum tap targets
 * - 18sp+ font sizes
 * - Clear visual feedback
 * - Screen reader labels
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ViewerControls.css';

/**
 * ViewerControls Component
 * @param {Object} props
 * @param {number} props.currentPage - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.scale - Current zoom scale
 * @param {function} props.onPrevious - Previous page handler
 * @param {function} props.onNext - Next page handler
 * @param {function} props.onZoomIn - Zoom in handler
 * @param {function} props.onZoomOut - Zoom out handler
 * @param {function} props.onResetZoom - Reset zoom handler
 * @param {boolean} props.canPrevious - Can navigate to previous page
 * @param {boolean} props.canNext - Can navigate to next page
 */
const ViewerControls = ({
  currentPage,
  totalPages,
  scale,
  onPrevious,
  onNext,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canPrevious = false,
  canNext = false,
}) => {
  // Format scale as percentage for display
  const zoomPercent = Math.round(scale * 100);

  return (
    <div 
      className="viewer-controls" 
      role="toolbar" 
      aria-label="Document navigation and zoom controls"
    >
      {/* Page Navigation Group */}
      <div className="controls-group" role="group" aria-label="Page navigation">
        <button
          type="button"
          className="control-btn nav-btn"
          onClick={onPrevious}
          disabled={!canPrevious}
          aria-label={`Go to previous page, page ${currentPage - 1}`}
          title="Previous Page"
        >
          <span className="control-btn-icon" aria-hidden="true">←</span>
          <span className="control-btn-text">Previous</span>
        </button>

        <button
          type="button"
          className="control-btn nav-btn"
          onClick={onNext}
          disabled={!canNext}
          aria-label={`Go to next page, page ${currentPage + 1}`}
          title="Next Page"
        >
          <span className="control-btn-text">Next</span>
          <span className="control-btn-icon" aria-hidden="true">→</span>
        </button>
      </div>

      {/* Zoom Controls Group */}
      <div className="controls-group" role="group" aria-label="Zoom controls">
        <button
          type="button"
          className="control-btn zoom-btn"
          onClick={onZoomOut}
          disabled={scale <= 0.5}
          aria-label="Zoom out"
          title="Zoom Out"
        >
          <span className="control-btn-icon" aria-hidden="true">−</span>
          <span className="control-btn-text">Zoom Out</span>
        </button>

        <div className="zoom-indicator" aria-live="polite">
          <span className="zoom-icon" aria-hidden="true">🔍</span>
          <span className="zoom-value">{zoomPercent}%</span>
        </div>

        <button
          type="button"
          className="control-btn zoom-btn"
          onClick={onZoomIn}
          disabled={scale >= 3.0}
          aria-label="Zoom in"
          title="Zoom In"
        >
          <span className="control-btn-icon" aria-hidden="true">+</span>
          <span className="control-btn-text">Zoom In</span>
        </button>

        <button
          type="button"
          className="control-btn zoom-reset-btn"
          onClick={onResetZoom}
          aria-label="Reset zoom to fit screen"
          title="Reset Zoom"
        >
          <span className="control-btn-icon" aria-hidden="true">⟲</span>
          <span className="control-btn-text">Reset</span>
        </button>
      </div>

      {/* Quick Page Jump (for longer documents) */}
      {totalPages > 5 && (
        <div className="controls-group quick-jump" role="group" aria-label="Quick page jump">
          <button
            type="button"
            className="control-btn jump-btn"
            onClick={() => onPrevious()}
            disabled={currentPage <= 1}
            aria-label="Go back 5 pages"
            title="Back 5 Pages"
          >
            <span className="control-btn-icon" aria-hidden="true">«</span>
            <span className="control-btn-text">-5</span>
          </button>

          <button
            type="button"
            className="control-btn jump-btn"
            onClick={() => onNext()}
            disabled={currentPage >= totalPages}
            aria-label="Go forward 5 pages"
            title="Forward 5 Pages"
          >
            <span className="control-btn-icon" aria-hidden="true">»</span>
            <span className="control-btn-text">+5</span>
          </button>
        </div>
      )}
    </div>
  );
};

ViewerControls.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  scale: PropTypes.number.isRequired,
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onZoomIn: PropTypes.func.isRequired,
  onZoomOut: PropTypes.func.isRequired,
  onResetZoom: PropTypes.func.isRequired,
  canPrevious: PropTypes.bool,
  canNext: PropTypes.bool,
};

/**
 * CompactViewerControls Component
 * Simplified controls for smaller screens
 */
export const CompactViewerControls = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  canPrevious = false,
  canNext = false,
}) => {
  return (
    <div 
      className="viewer-controls viewer-controls-compact" 
      role="toolbar" 
      aria-label="Page navigation controls"
    >
      <button
        type="button"
        className="control-btn control-btn-icon-only"
        onClick={onPrevious}
        disabled={!canPrevious}
        aria-label={`Previous page, page ${currentPage - 1} of ${totalPages}`}
        title="Previous Page"
      >
        <span className="control-btn-icon" aria-hidden="true">←</span>
        <span className="visually-hidden">Previous</span>
      </button>

      <div className="compact-page-indicator">
        <span>{currentPage}</span>
        <span className="separator">/</span>
        <span>{totalPages}</span>
      </div>

      <button
        type="button"
        className="control-btn control-btn-icon-only"
        onClick={onNext}
        disabled={!canNext}
        aria-label={`Next page, page ${currentPage + 1} of ${totalPages}`}
        title="Next Page"
      >
        <span className="control-btn-icon" aria-hidden="true">→</span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
};

CompactViewerControls.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  canPrevious: PropTypes.bool,
  canNext: PropTypes.bool,
};

export default ViewerControls;
