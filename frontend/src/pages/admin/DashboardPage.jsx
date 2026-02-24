/**
 * DashboardPage.jsx - Admin Slot Management
 * Lists all slots with update options
 *
 * Accessibility Requirements:
 * - Clean slot list with name + last updated date
 * - One large "Update File" button per slot
 * - No nested navigation
 * - Clear empty state
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminHeader } from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { AlertError } from '../components/common/ErrorMessage';
import SlotList from '../components/admin/SlotList';
import { useAuth } from '../hooks/useAuth';
import { getAllSlots, toggleSlotStatus } from '../services/slotService';
import { logout } from '../services/authService';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  /**
   * Fetch all slots on mount
   */
  const fetchSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllSlots();
      setSlots(data);
    } catch (err) {
      setError(err?.message || 'Failed to load slots. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  /**
   * Navigate to upload page for a slot
   */
  const handleUpdateFile = (slot) => {
    navigate(`/admin/slots/${slot.slug}/upload`);
  };

  /**
   * Navigate to new slot page
   */
  const handleCreateNew = () => {
    navigate('/admin/slots/new');
  };

  /**
   * Handle slot status toggle
   */
  const handleToggleStatus = async (slot) => {
    try {
      const updatedSlot = await toggleSlotStatus(slot.id, !slot.isActive);
      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? updatedSlot : s))
      );
      showNotification(
        updatedSlot.isActive
          ? `"${slot.displayName || slot.name}" is now active`
          : `"${slot.displayName || slot.name}" has been deactivated`
      );
    } catch (err) {
      setError('Failed to update slot status. Please try again.');
    }
  };

  /**
   * Handle rename (navigate to edit page - future feature)
   */
  const handleRename = (slot) => {
    // Future: navigate to edit page
    showNotification('Rename feature coming soon');
  };

  /**
   * Handle copy link
   */
  const handleCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showNotification('Link copied to clipboard!');
    } catch (err) {
      setError('Failed to copy link. Please copy it manually.');
    }
  };

  /**
   * Handle preview
   */
  const handlePreview = (slug) => {
    window.open(`/view/${slug}`, '_blank');
  };

  /**
   * Show temporary notification
   */
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="dashboard-page">
      <AdminHeader
        title="My Document Slots"
        user={user}
        onLogout={handleLogout}
      />

      <div className="dashboard-content">
        {/* Notification Banner */}
        {notification && (
          <div className="dashboard-notification" role="status">
            <span className="notification-icon" aria-hidden="true">✓</span>
            <span>{notification}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <AlertError
            message={error}
            onDismiss={() => setError(null)}
            className="dashboard-error"
          />
        )}

        {/* Create New Slot Button */}
        <div className="dashboard-actions">
          <Button
            variant="primary"
            size="large"
            onClick={handleCreateNew}
            icon="➕"
          >
            Create New Slot
          </Button>
        </div>

        {/* Slots List */}
        <div className="slots-section">
          <h2 className="section-title">Your Slots</h2>
          
          <SlotList
            slots={slots}
            isLoading={isLoading}
            error={error}
            onUpdateFile={handleUpdateFile}
            onRename={handleRename}
            onToggleStatus={handleToggleStatus}
            onCopyLink={handleCopyLink}
            onPreview={handlePreview}
            onCreateNew={handleCreateNew}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
