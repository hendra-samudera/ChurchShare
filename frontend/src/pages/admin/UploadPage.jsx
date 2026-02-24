/**
 * UploadPage.jsx - Upload File to Slot
 * File upload interface for administrators
 *
 * Accessibility Requirements:
 * - Tap opens file picker directly (no confirmation dialog)
 * - Upload progress shown with bar and percentage
 * - Clear error messages
 * - Large tap targets (56px minimum)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import { FormError } from '../components/common/ErrorMessage';
import UploadArea from '../components/admin/UploadArea';
import ProgressBar from '../components/admin/ProgressBar';
import { getSlotBySlug, uploadFile } from '../services/slotService';
import './UploadPage.css';

const UploadPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [slot, setSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('uploading'); // 'uploading', 'success', 'error'
  const [error, setError] = useState(null);
  const [slotError, setSlotError] = useState(null);

  const isNewSlot = location.state?.isNewSlot;

  /**
   * Fetch slot data on mount
   */
  useEffect(() => {
    const fetchSlot = async () => {
      setIsLoading(true);
      setSlotError(null);

      try {
        const data = await getSlotBySlug(slug);
        setSlot(data);
      } catch (err) {
        setSlotError('Could not load slot information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlot();
  }, [slug]);

  /**
   * Handle file selection from UploadArea
   */
  const handleFileSelect = (file, fileError) => {
    if (fileError) {
      setError(fileError);
      setSelectedFile(null);
    } else {
      setError(null);
      setSelectedFile(file);
      setUploadStatus('uploading');
      setUploadProgress(0);
    }
  };

  /**
   * Clear selected file
   */
  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    setUploadStatus('uploading');
  };

  /**
   * Handle upload with progress tracking
   */
  const handleUpload = async () => {
    if (!selectedFile || !slot) return;

    setIsUploading(true);
    setError(null);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      await uploadFile(slot.slug, selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      // Upload successful
      setUploadProgress(100);
      setUploadStatus('success');

      // Wait a moment to show success state, then navigate
      setTimeout(() => {
        navigate(`/admin/slots/${slot.slug}/success`, {
          state: {
            slot,
            fileName: selectedFile.name,
          },
        });
      }, 800);
    } catch (err) {
      setUploadStatus('error');
      setError(err?.message || 'The file could not be uploaded. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Cancel upload
   */
  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="upload-page">
        <PageHeader
          title="Upload Document"
          subtitle="Loading slot information..."
          showBack={true}
          backTo="/admin/dashboard"
        />
        <div className="upload-loading">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Slot error state
  if (slotError || !slot) {
    return (
      <div className="upload-page">
        <PageHeader
          title="Upload Document"
          showBack={true}
          backTo="/admin/dashboard"
        />
        <div className="upload-error-state">
          <span className="upload-error-icon" aria-hidden="true">⚠️</span>
          <h2>Slot Not Found</h2>
          <p>{slotError || 'This slot does not exist.'}</p>
          <Button
            variant="primary"
            size="large"
            onClick={() => navigate('/admin/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <PageHeader
        title="Upload Document"
        subtitle={isNewSlot ? 'New slot! Upload your first file.' : `Uploading to "${slot.displayName || slot.name}"`}
        showBack={true}
        backTo="/admin/dashboard"
      />

      <div className="upload-content">
        {/* Slot Info */}
        <div className="slot-info-banner">
          <h3 className="slot-info-title">{slot.displayName || slot.name}</h3>
          <p className="slot-info-subtitle">
            {slot.isActive ? '✓ Active' : '○ Inactive'} • 
            Link: <code>churchshare.app/view/{slot.slug}</code>
          </p>
        </div>

        {/* Current File Info (if exists) */}
        {slot.lastFileUploadAt && (
          <div className="current-file-info">
            <span className="current-file-label">Current file:</span>
            <span className="current-file-name">
              Updated {new Date(slot.lastFileUploadAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Upload Area */}
        <UploadArea
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          disabled={isUploading}
          error={error}
          onClear={handleClearFile}
        />

        {/* Upload Progress */}
        {(isUploading || uploadStatus === 'success' || uploadStatus === 'error') && (
          <div className="upload-progress-section">
            <ProgressBar
              progress={uploadProgress}
              label={
                uploadStatus === 'success'
                  ? 'Upload complete!'
                  : uploadStatus === 'error'
                  ? 'Upload failed'
                  : 'Uploading...'
              }
              status={uploadStatus}
              size="large"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="upload-actions">
          {uploadStatus === 'success' ? (
            <Button
              variant="primary"
              size="large"
              onClick={() =>
                navigate(`/admin/slots/${slot.slug}/success`, {
                  state: { slot, fileName: selectedFile?.name },
                })
              }
              fullWidth
              icon="✓"
            >
              Continue
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="large"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                loading={isUploading}
                fullWidth
                icon={isUploading ? null : '📤'}
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>

              <div className="upload-cancel">
                <button
                  type="button"
                  className="cancel-upload-button"
                  onClick={handleCancel}
                  disabled={isUploading}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <div className="upload-help">
          <p className="help-text">
            <strong>Tip:</strong> Only PDF files are accepted. Maximum file size is 20MB.
            The upload will start immediately after you select a file.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
