/**
 * SlotCard.jsx
 * Individual slot display card for admin dashboard
 * 
 * Features:
 * - Large, clear slot name
 * - Last updated timestamp
 * - Active/inactive status badge
 * - Primary "Update File" button (full-width)
 * - Secondary actions menu (rename, deactivate, copy link, preview)
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import './SlotCard.css';

/**
 * Format timestamp to human-readable relative time
 */
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never updated';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} week(s) ago`;
  
  return `Updated ${date.toLocaleDateString()}`;
};

/**
 * SlotCard Component
 */
const SlotCard = ({ 
  slot, 
  onUpdateFile, 
  onRename, 
  onToggleStatus, 
  onCopyLink,
  onPreview 
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    id,
    slug,
    displayName,
    name,
    isActive,
    lastUpdatedAt,
    viewerUrl,
  } = slot;

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleAction = (action) => {
    setMenuOpen(false);
    switch (action) {
      case 'rename':
        onRename?.(slot);
        break;
      case 'toggle':
        onToggleStatus?.(slot);
        break;
      case 'copy':
        onCopyLink?.(viewerUrl || `https://churchshare.app/view/${slug}`);
        break;
      case 'preview':
        onPreview?.(slug);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`slot-card ${!isActive ? 'slot-card-inactive' : ''}`}>
      {/* Card Header */}
      <div className="slot-card-header">
        <div className="slot-card-title-section">
          <h3 className="slot-card-title">{displayName || name}</h3>
          <span className={`slot-card-status ${isActive ? 'status-active' : 'status-inactive'}`}>
            {isActive ? '✓ Active' : '○ Inactive'}
          </span>
        </div>
        
        {/* Actions Menu Button */}
        <div className="slot-card-menu">
          <button
            type="button"
            className="slot-card-menu-btn"
            onClick={handleMenuToggle}
            aria-label="More options"
            aria-expanded={menuOpen}
          >
            ⋮
          </button>
          
          {menuOpen && (
            <div className="slot-card-menu-dropdown" role="menu">
              <button
                type="button"
                className="slot-card-menu-item"
                onClick={() => handleAction('rename')}
                role="menuitem"
              >
                ✏️ Rename
              </button>
              <button
                type="button"
                className="slot-card-menu-item"
                onClick={() => handleAction('toggle')}
                role="menuitem"
              >
                {isActive ? '🚫 Deactivate' : '✅ Activate'}
              </button>
              <button
                type="button"
                className="slot-card-menu-item"
                onClick={() => handleAction('copy')}
                role="menuitem"
              >
                🔗 Copy Link
              </button>
              <button
                type="button"
                className="slot-card-menu-item"
                onClick={() => handleAction('preview')}
                role="menuitem"
              >
                👁️ Preview
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <p className="slot-card-updated">
        <span aria-hidden="true">🕐</span>
        {formatRelativeTime(lastUpdatedAt)}
      </p>

      {/* Primary Action - Update File */}
      <div className="slot-card-actions">
        <Button
          variant="primary"
          size="large"
          onClick={() => onUpdateFile(slot)}
          fullWidth
          icon="📁"
        >
          Update File
        </Button>
      </div>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div 
          className="slot-card-menu-overlay" 
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

SlotCard.propTypes = {
  slot: PropTypes.shape({
    id: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    isActive: PropTypes.bool,
    lastUpdatedAt: PropTypes.string,
    viewerUrl: PropTypes.string,
  }).isRequired,
  onUpdateFile: PropTypes.func,
  onRename: PropTypes.func,
  onToggleStatus: PropTypes.func,
  onCopyLink: PropTypes.func,
  onPreview: PropTypes.func,
};

export default SlotCard;
