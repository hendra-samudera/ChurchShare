/**
 * ViewerPage - Public PDF Viewer
 * Displays PDF document for a given slot slug
 *
 * Accessibility Requirements:
 * - Document title is largest text on screen (20sp+, bold)
 * - PDF loads within 3 seconds or shows spinner
 * - "Save to My Phone" button is secondary action
 * - Empty state is warm and friendly
 * - No login prompts before PDF
 * - Minimum 48x48dp tap targets
 * - 4.5:1+ contrast ratio
 *
 * Zero-Download Principle:
 * - PDF is rendered in browser using PDF.js
 * - No file is saved to device storage unless user explicitly taps download
 * - Cache-bust headers ensure latest version is always fetched
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import PdfViewer from '../components/viewer/PdfViewer';
import { publicAPI } from '../config/api';
import './ViewerPage.css';

/**
 * Fetch slot metadata
 */
const fetchSlotMeta = async (slug) => {
  const response = await publicAPI.getSlotBySlug(slug);
  return response.data;
};

/**
 * Fetch PDF file as blob URL
 */
const fetchPdfFile = async (slug) => {
  const response = await publicAPI.getFileBySlug(slug);
  // Create blob URL for PDF.js to use
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  return url;
};

/**
 * Download PDF file to device
 */
const downloadPdfFile = async (slug, filename) => {
  const response = await publicAPI.getFileBySlug(slug);
  const blob = new Blob([response.data], { type: 'application/pdf' });
  
  // Create download link
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'document.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up blob URL after a delay
  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 100);
};

/**
 * ViewerPage Component
 * Main public PDF viewer page for elderly users
 */
const ViewerPage = () => {
  const { slug } = useParams();
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  // Fetch slot metadata (no auth required)
  const {
    data: slotData,
    isLoading: isLoadingMeta,
    error: metaError,
    refetch: refetchMeta,
  } = useQuery({
    queryKey: ['slot-meta', slug],
    queryFn: () => fetchSlotMeta(slug),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch PDF file when slot data is available
  useEffect(() => {
    let blobUrl = null;

    const loadPdf = async () => {
      if (!slug) return;

      try {
        const url = await fetchPdfFile(slug);
        blobUrl = url;
        setPdfBlobUrl(url);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setPdfBlobUrl(null);
      }
    };

    loadPdf();

    // Cleanup blob URL on unmount or slug change
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [slug]);

  // Handle download
  const handleDownload = useCallback(async () => {
    if (!slug || !slotData) return;

    try {
      setDownloadError(null);
      const filename = slotData.filename || `${slug}.pdf`;
      await downloadPdfFile(slug, filename);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadError({
        message: 'Could not save file. Please check your storage and try again.',
      });
    }
  }, [slug, slotData]);

  // Handle retry for metadata
  const handleRetry = useCallback(() => {
    setDownloadError(null);
    refetchMeta();
  }, [refetchMeta]);

  // Determine document title
  const documentTitle = slotData?.title || 'Document';

  // Loading state - fetching metadata
  if (isLoadingMeta) {
    return (
      <div className="viewer-page">
        <PageHeader
          title="Document Viewer"
          showBack={true}
        />
        <div className="viewer-content">
          <div className="viewer-loading">
            <LoadingSpinner 
              size="large" 
              message="Loading your document…" 
            />
          </div>
        </div>
      </div>
    );
  }

  // Error state - metadata fetch failed
  if (metaError) {
    return (
      <div className="viewer-page">
        <PageHeader
          title="Document Viewer"
          showBack={true}
        />
        <div className="viewer-content">
          <div className="viewer-error">
            <ErrorMessage
              type="not_found"
              message="This link doesn't exist. Please check the link you received."
              onRetry={handleRetry}
              retryLabel="Try Again"
            />
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no PDF uploaded yet
  if (!slotData?.hasFile && !pdfBlobUrl) {
    return (
      <div className="viewer-page">
        <PageHeader
          title={documentTitle}
          showBack={true}
        />
        <div className="viewer-content">
          <div className="viewer-empty">
            <span className="empty-icon" aria-hidden="true">📭</span>
            <h2 className="empty-title">
              Nothing uploaded here yet. Check back soon! 🙏
            </h2>
            <p className="empty-text">
              The document owner hasn't uploaded a file to this slot yet.
              Please check back later or contact them for updates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main viewer - PDF ready to display
  return (
    <div className="viewer-page">
      <PageHeader
        title="Document Viewer"
        showBack={true}
      />

      <div className="viewer-content">
        <PdfViewer
          pdfUrl={pdfBlobUrl}
          documentTitle={documentTitle}
          onDownload={handleDownload}
          showDownload={true}
        />

        {/* Download error message */}
        {downloadError && (
          <div className="viewer-download-error">
            <ErrorMessage
              type="default"
              message={downloadError.message}
              onRetry={handleDownload}
              retryLabel="Try Download Again"
            />
          </div>
        )}

        {/* Accessibility helper text */}
        <div className="viewer-accessibility-help" role="note" aria-label="Viewing instructions">
          <p>
            <strong>Tip:</strong> Use two fingers to pinch and zoom. 
            Scroll up and down to navigate pages.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ViewerPage;
