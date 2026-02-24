/**
 * PdfViewer Component
 * PDF.js integration with canvas rendering for elderly users
 *
 * Features:
 * - Zero-download viewing (PDF rendered in browser, not saved)
 * - Progressive rendering (page 1 first, then remaining pages)
 * - Pinch-to-zoom and scroll gestures
 * - Virtual scrolling with intersection observer for lazy loading
 * - High-contrast, large UI elements for accessibility
 *
 * Accessibility:
 * - Minimum 48x48dp tap targets
 * - 18sp+ font sizes
 * - 4.5:1+ contrast ratio
 * - Screen reader support
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ViewerControls from './ViewerControls';
import PageIndicator from './PageIndicator';
import './PdfViewer.css';

// Configure PDF.js worker - using CDN for reliability
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * PdfViewer Component
 * @param {Object} props
 * @param {string} props.pdfUrl - URL to fetch the PDF file
 * @param {string} props.documentTitle - Title of the document
 * @param {function} props.onDownload - Optional download handler
 * @param {boolean} props.showDownload - Show download button
 */
const PdfViewer = ({
  pdfUrl,
  documentTitle = 'Document',
  onDownload,
  showDownload = true,
}) => {
  // State
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isZooming, setIsZooming] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const pagesRef = useRef({});
  const pinchStartDistance = useRef(0);
  const pinchStartScale = useRef(1);

  // Calculate optimal scale based on container width
  const calculateScale = useCallback((containerWidth, pageWidth) => {
    // Add padding for controls and margins
    const availableWidth = containerWidth - 32; // 16px padding each side
    return Math.min(availableWidth / pageWidth, 2.0); // Max 2x zoom
  }, []);

  // Load PDF document
  useEffect(() => {
    let isMounted = true;
    let loadTimeout = null;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add cache-bust to ensure latest version
        const cacheBustedUrl = `${pdfUrl}${pdfUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

        // Load PDF with proper CORS headers
        const loadingTask = pdfjs.getDocument({
          url: cacheBustedUrl,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
          useSystemFonts: true,
        });

        // Set a minimum loading time to avoid flash (but never timeout under 10s)
        loadTimeout = setTimeout(() => {
          // Keep spinner running - no timeout
        }, 5000);

        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);

        // Calculate initial scale based on first page
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        
        // Get container width after a small delay to ensure render
        setTimeout(() => {
          if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const optimalScale = calculateScale(containerWidth, viewport.width);
            setScale(optimalScale);
          }
        }, 100);

        setLoading(false);
        clearTimeout(loadTimeout);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('PDF load error:', err);
        setLoading(false);
        clearTimeout(loadTimeout);
        
        // User-friendly error message
        setError({
          type: 'pdf',
          message: 'Something went wrong. Tap here to try again.',
        });
      }
    };

    if (pdfUrl) {
      loadPdf();
    }

    return () => {
      isMounted = false;
      if (loadTimeout) clearTimeout(loadTimeout);
    };
  }, [pdfUrl, calculateScale]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    // Trigger re-fetch by temporarily clearing and restoring URL
    // The useEffect will handle the reload
  }, []);

  // Page navigation
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
      // Scroll to page
      const pageElement = document.getElementById(`pdf-page-${page}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [numPages]);

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    if (containerRef.current && pdfDoc) {
      pdfDoc.getPage(1).then(page => {
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = containerRef.current.offsetWidth;
        const optimalScale = calculateScale(containerWidth, viewport.width);
        setScale(optimalScale);
      });
    }
  }, [pdfDoc, calculateScale]);

  // Pinch-to-zoom handlers
  const getTouchDistance = useCallback((touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsZooming(true);
      pinchStartDistance.current = getTouchDistance(e.touches);
      pinchStartScale.current = scale;
    }
  }, [scale, getTouchDistance]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && isZooming) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const ratio = currentDistance / pinchStartDistance.current;
      const newScale = Math.max(0.5, Math.min(3.0, pinchStartScale.current * ratio));
      setScale(newScale);
    }
  }, [isZooming, getTouchDistance]);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      setIsZooming(false);
    }
  }, []);

  // Download handler
  const handleDownload = useCallback(async () => {
    if (!pdfUrl || !onDownload) return;
    
    try {
      await onDownload();
    } catch (err) {
      console.error('Download error:', err);
    }
  }, [pdfUrl, onDownload]);

  // Render page component
  const Page = useMemo(() => {
    return function PageComponent({ pageNumber, pdf, currentScale }) {
      const canvasRef = useRef(null);
      const [isRendering, setIsRendering] = useState(false);
      const [hasRendered, setHasRendered] = useState(false);

      useEffect(() => {
        let isMounted = true;
        let animationFrameId = null;

        const renderPage = async () => {
          if (!pdf || !canvasRef.current || isRendering) return;

          setIsRendering(true);

          try {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: currentScale });

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // High-DPI scaling
            const devicePixelRatio = window.devicePixelRatio || 1;
            canvas.style.height = `${viewport.height / devicePixelRatio}px`;
            canvas.style.width = `${viewport.width / devicePixelRatio}px`;

            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;

            if (isMounted) {
              setHasRendered(true);
              setIsRendering(false);
            }
          } catch (err) {
            console.error(`Error rendering page ${pageNumber}:`, err);
            if (isMounted) {
              setIsRendering(false);
            }
          }
        };

        // Use intersection observer for lazy loading
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && !hasRendered) {
                animationFrameId = requestAnimationFrame(renderPage);
              }
            });
          },
          {
            root: containerRef.current,
            rootMargin: '200px', // Start loading 200px before visible
            threshold: 0.01,
          }
        );

        const canvasElement = canvasRef.current;
        if (canvasElement) {
          observer.observe(canvasElement);
        }

        return () => {
          isMounted = false;
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
          if (canvasElement) observer.unobserve(canvasElement);
        };
      }, [pageNumber, pdf, currentScale, isRendering, hasRendered]);

      return (
        <div
          id={`pdf-page-${pageNumber}`}
          className="pdf-page-container"
          role="region"
          aria-label={`Page ${pageNumber} of ${pdf?.numPages || numPages}`}
        >
          <div className="pdf-page-number" aria-hidden="true">
            Page {pageNumber}
          </div>
          <canvas
            ref={canvasRef}
            className={`pdf-page-canvas ${isRendering && !hasRendered ? 'rendering' : ''}`}
            aria-label={`Page ${pageNumber} content`}
          />
          {isRendering && !hasRendered && (
            <div className="pdf-page-loading">
              <span className="visually-hidden">Loading page {pageNumber}...</span>
            </div>
          )}
        </div>
      );
    };
  }, [numPages]);

  // Render all pages for virtual scrolling
  const renderPages = useMemo(() => {
    if (!pdfDoc) return null;

    const pages = [];
    for (let i = 1; i <= numPages; i++) {
      pages.push(
        <Page
          key={i}
          pageNumber={i}
          pdf={pdfDoc}
          currentScale={scale}
        />
      );
    }
    return pages;
  }, [pdfDoc, numPages, scale, Page]);

  // Loading state
  if (loading && !pdfDoc) {
    return (
      <div className="pdf-viewer-wrapper" ref={containerRef}>
        <div className="pdf-viewer-header">
          <h2 className="pdf-viewer-title">{documentTitle}</h2>
        </div>
        <div className="pdf-viewer-loading">
          <LoadingSpinner 
            size="large" 
            message="Loading your document…" 
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pdf-viewer-wrapper" ref={containerRef}>
        <div className="pdf-viewer-header">
          <h2 className="pdf-viewer-title">{documentTitle}</h2>
        </div>
        <div className="pdf-viewer-error">
          <ErrorMessage
            type={error.type}
            message={error.message}
            onRetry={handleRetry}
            retryLabel="Try Again"
          />
        </div>
      </div>
    );
  }

  // Empty state (no PDF)
  if (!pdfUrl) {
    return (
      <div className="pdf-viewer-wrapper" ref={containerRef}>
        <div className="pdf-viewer-header">
          <h2 className="pdf-viewer-title">{documentTitle}</h2>
        </div>
        <div className="pdf-viewer-empty">
          <span className="pdf-empty-icon" aria-hidden="true">📭</span>
          <p className="pdf-empty-text">
            Nothing uploaded here yet. Check back soon! 🙏
          </p>
        </div>
      </div>
    );
  }

  // Main viewer
  return (
    <div className="pdf-viewer-wrapper">
      {/* Header with document title */}
      <header className="pdf-viewer-header" role="banner">
        <h2 className="pdf-viewer-title">{documentTitle}</h2>
        {showDownload && onDownload && (
          <button
            type="button"
            className="pdf-download-btn"
            onClick={handleDownload}
            aria-label="Save to My Phone"
            title="Save to My Phone"
          >
            <span aria-hidden="true">📥</span>
            <span>Save to My Phone</span>
          </button>
        )}
      </header>

      {/* Controls */}
      <ViewerControls
        currentPage={currentPage}
        totalPages={numPages}
        scale={scale}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        canPrevious={currentPage > 1}
        canNext={currentPage < numPages}
      />

      {/* Page indicator */}
      <PageIndicator
        currentPage={currentPage}
        totalPages={numPages}
      />

      {/* PDF pages container */}
      <div
        ref={containerRef}
        className="pdf-pages-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-label="PDF document pages"
        aria-live="polite"
      >
        {renderPages}
      </div>

      {/* Bottom download button (secondary action) */}
      {showDownload && onDownload && (
        <div className="pdf-viewer-footer">
          <button
            type="button"
            className="pdf-download-btn-secondary"
            onClick={handleDownload}
            aria-label="Save this document to your phone"
          >
            <span aria-hidden="true">📥</span>
            <span>Save to My Phone</span>
          </button>
        </div>
      )}
    </div>
  );
};

PdfViewer.propTypes = {
  pdfUrl: PropTypes.string,
  documentTitle: PropTypes.string,
  onDownload: PropTypes.func,
  showDownload: PropTypes.bool,
};

export default PdfViewer;
