/**
 * SlotList.jsx
 * Renders a list of slot cards for the admin dashboard
 * 
 * Features:
 * - Grid layout for multiple slots
 * - Empty state when no slots exist
 * - Loading state during fetch
 * - Error state display
 */

import React from 'react';
import PropTypes from 'prop-types';
import SlotCard from './SlotCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import './SlotList.css';

/**
 * SlotList Component
 */
const SlotList = ({ 
  slots, 
  isLoading, 
  error, 
  onUpdateFile,
  onRename,
  onToggleStatus,
  onCopyLink,
  onPreview,
  onCreateNew 
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="slot-list-loading">
        <LoadingSpinner size="large" message="Loading your slots..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="slot-list-error">
        <ErrorMessage
          type="network"
          message={error}
          onRetry={() => window.location.reload()}
          retryLabel="Reload Page"
        />
      </div>
    );
  }

  // Empty state
  if (!slots || slots.length === 0) {
    return (
      <div className="slot-list-empty">
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">📭</span>
          <h3 className="empty-state-title">No slots yet</h3>
          <p className="empty-state-text">
            Create your first slot to start sharing documents with your church community.
          </p>
          <button
            type="button"
            className="empty-state-button"
            onClick={onCreateNew}
          >
            Create Your First Slot
          </button>
        </div>
      </div>
    );
  }

  // Slots grid
  return (
    <div className="slot-list">
      <div className="slots-grid">
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            onUpdateFile={onUpdateFile}
            onRename={onRename}
            onToggleStatus={onToggleStatus}
            onCopyLink={onCopyLink}
            onPreview={onPreview}
          />
        ))}
      </div>
    </div>
  );
};

SlotList.propTypes = {
  slots: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      displayName: PropTypes.string,
      isActive: PropTypes.bool,
      lastUpdatedAt: PropTypes.string,
      viewerUrl: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onUpdateFile: PropTypes.func,
  onRename: PropTypes.func,
  onToggleStatus: PropTypes.func,
  onCopyLink: PropTypes.func,
  onPreview: PropTypes.func,
  onCreateNew: PropTypes.func,
};

SlotList.defaultProps = {
  slots: [],
  isLoading: false,
  error: null,
};

export default SlotList;
