/**
 * SuccessPage.jsx - Upload Success Confirmation
 * Shows success message with permanent link and WhatsApp share
 *
 * Accessibility Requirements:
 * - Full-screen, unambiguous success state
 * - Permanent link displayed clearly
 * - Large "Copy Link" button
 * - WhatsApp share with pre-composed message
 * - Option to upload another file
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { AlertError } from '../components/common/ErrorMessage';
import { getSlotBySlug } from '../services/slotService';
import './SuccessPage.css';

const SuccessPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [slot, setSlot] = useState(null);
  const [fileName, setFileName] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const viewerUrl = slot?.viewerUrl || `https://churchshare.app/view/${slug}`;

  /**
   * Load slot data
   */
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        // Try to get slot data from location state first
        if (location.state?.slot) {
          setSlot(location.state.slot);
          setFileName(location.state.fileName || '');
        } else {
          // Fetch from API
          const data = await getSlotBySlug(slug);
          setSlot(data);
        }
      } catch (err) {
        // Use constructed URL if fetch fails
        setSlot({ slug, displayName: 'Document' });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [slug, location.state]);

  /**
   * Copy link to clipboard
   */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(viewerUrl);
      setCopySuccess(true);
      setCopyError(null);

      // Reset success message after 3 seconds
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      setCopyError('Could not copy link. Please copy it manually.');
    }
  };

  /**
   * Share via WhatsApp
   * Opens WhatsApp with pre-composed message
   */
  const handleShareWhatsApp = () => {
    const slotName = slot?.displayName || slot?.name || 'Document';
    
    // Create the WhatsApp message
    const message = `📖 *${slotName}* is ready!
Tap the link below to read it — no download needed:

${viewerUrl}

(This link always shows the latest version 🙏)`;

    // Encode for URL
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  /**
   * Navigate back to dashboard
   */
  const handleBackToDashboard = () => {
    navigate('/admin/dashboard');
  };

  /**
   * Upload another file
   */
  const handleUploadAnother = () => {
    navigate(`/admin/slots/${slug}/upload`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="success-page">
        <PageHeader title="Upload Successful!" showBack={false} />
        <div className="success-loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const slotName = slot?.displayName || slot?.name || 'Document';

  return (
    <div className="success-page">
      <PageHeader
        title="File Updated!"
        showBack={false}
      />

      <div className="success-content">
        {/* Success Icon */}
        <div className="success-icon" aria-hidden="true" role="img">
          ✅
        </div>

        {/* Success Message */}
        <h2 className="success-title">
          {slotName} is ready!
        </h2>

        {fileName && (
          <p className="success-file-name">
            <span aria-hidden="true">📄</span> {fileName}
          </p>
        )}

        <p className="success-text">
          Your document is now available for sharing. Use the link below to share it with your church community.
        </p>

        {/* Share Link */}
        <div className="share-link-container">
          <label htmlFor="share-link" className="form-label">
            Share this link:
          </label>
          <div className="share-link-wrapper">
            <input
              id="share-link"
              type="text"
              className="form-control share-link-input"
              value={viewerUrl}
              readOnly
              aria-label="Shareable link"
            />
            <Button
              variant="secondary"
              onClick={handleCopyLink}
              aria-label="Copy link to clipboard"
              className="copy-button"
              disabled={copySuccess}
            >
              {copySuccess ? '✓ Copied!' : 'Copy Link'}
            </Button>
          </div>

          {copyError && (
            <AlertError
              message={copyError}
              onDismiss={() => setCopyError(null)}
              className="copy-error"
            />
          )}

          {copySuccess && (
            <p className="copy-success-message" role="status">
              ✓ Link copied to clipboard!
            </p>
          )}
        </div>

        {/* Share Buttons */}
        <div className="share-buttons">
          <Button
            variant="success"
            size="large"
            onClick={handleShareWhatsApp}
            fullWidth
            icon="📱"
          >
            Share via WhatsApp
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="success-actions">
          <Button
            variant="primary"
            size="large"
            onClick={handleUploadAnother}
            fullWidth
            icon="📁"
          >
            Upload Another File
          </Button>

          <button
            type="button"
            className="back-to-dashboard-link"
            onClick={handleBackToDashboard}
          >
            ← Back to My Slots
          </button>
        </div>

        {/* Additional Info */}
        <div className="success-info">
          <p className="info-text">
            <strong>Note:</strong> Anyone with this link can view the document.
            No login is required for viewers. The link always shows the latest version.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
