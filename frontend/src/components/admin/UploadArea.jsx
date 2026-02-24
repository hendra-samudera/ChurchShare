/**
 * UploadArea.jsx
 * Large tap-to-upload component for file selection
 * 
 * Features:
 * - Tap opens file picker directly (no confirmation dialog)
 * - Shows selected file name and size
 * - Clear visual feedback for drag/drop (desktop)
 * - Large tap target for mobile
 * - PDF-only validation feedback
 */

import React, { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { validateFile } from '../../services/slotService';
import './UploadArea.css';

/**
 * UploadArea Component
 */
const UploadArea = ({ 
  onFileSelect, 
  selectedFile, 
  disabled,
  error,
  onClear 
}) => {
  const fileInputRef = useRef(null);

  /**
   * Handle file selection from input
   */
  const handleFileInput = useCallback((event) => {
    const file = event.target.files?.[0];
    
    if (file) {
      const validation = validateFile(file);
      
      if (validation.valid) {
        onFileSelect(file);
      } else {
        onFileSelect(null, validation.error);
      }
    }
    
    // Reset input so same file can be selected again
    event.target.value = '';
  }, [onFileSelect]);

  /**
   * Handle tap/click to open file picker
   */
  const handleTap = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-area">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileInput}
        className="upload-area-input"
        disabled={disabled}
        aria-label="Select PDF file"
        id="file-upload-input"
      />

      {/* File has been selected */}
      {selectedFile ? (
        <div className="upload-area-selected">
          <div className="upload-area-file-info">
            <span className="upload-area-file-icon" aria-hidden="true">📄</span>
            <div className="upload-area-file-details">
              <p className="upload-area-file-name">{selectedFile.name}</p>
              <p className="upload-area-file-size">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          
          {!disabled && onClear && (
            <button
              type="button"
              className="upload-area-clear-btn"
              onClick={onClear}
              aria-label="Remove selected file"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        /* No file selected - show upload prompt */
        <button
          type="button"
          className="upload-area-prompt"
          onClick={handleTap}
          disabled={disabled}
          aria-label="Tap to select a PDF file from your device"
        >
          <div className="upload-area-prompt-content">
            <span className="upload-area-prompt-icon" aria-hidden="true">📁</span>
            <span className="upload-area-prompt-text">
              Tap to select PDF file
            </span>
            <span className="upload-area-prompt-hint">
              PDF files only, max 20MB
            </span>
          </div>
        </button>
      )}

      {/* Error display */}
      {error && (
        <div className="upload-area-error" role="alert">
          <span className="upload-area-error-icon" aria-hidden="true">⚠️</span>
          <span className="upload-area-error-text">{error}</span>
        </div>
      )}
    </div>
  );
};

UploadArea.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  selectedFile: PropTypes.instanceOf(File),
  disabled: PropTypes.bool,
  error: PropTypes.string,
  onClear: PropTypes.func,
};

UploadArea.defaultProps = {
  selectedFile: null,
  disabled: false,
  error: null,
  onClear: null,
};

export default UploadArea;
