import { Injectable } from '@angular/core';

export interface PdfPageRenderOptions {
  scale?: number;
  viewport?: any;
}

@Injectable({ providedIn: 'root' })
export class PdfRenderService {
  private pdfDoc: any = null;
  private readonly pdfjsLib: any;

  constructor() {
    // Access PDF.js from global scope (loaded in index.html)
    this.pdfjsLib = (window as any)['pdfjsLib'];

    if (this.pdfjsLib) {
      // Configure worker source if not already configured
      if (!this.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        this.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
      }
    } else {
      console.warn('PDF.js not loaded. The PDF viewer will not work.');
    }
  }

  /**
   * Load PDF document from URL
   */
  async loadDocument(url: string): Promise<void> {
    if (!this.pdfjsLib) {
      throw new Error('PDF.js not loaded');
    }

    // Cache-bust: append timestamp to force fresh fetch
    const cacheBustedUrl = `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`;

    const loadingTask = this.pdfjsLib.getDocument({
      url: cacheBustedUrl,
      disableAutoFetch: false,
      disableStream: false,
      disableRange: false,
      maxImageSize: 1024 * 1024, // 1MB max image for low-spec devices
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/cmaps/',
      cMapPacked: true,
    });

    this.pdfDoc = await loadingTask.promise;
  }

  /**
   * Get total number of pages
   */
  getTotalPages(): number {
    return this.pdfDoc?.numPages ?? 0;
  }

  /**
   * Get PDF document proxy
   */
  getDocument(): any {
    return this.pdfDoc;
  }

  /**
   * Render a specific page to canvas
   */
  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    zoomLevel: number = 1.0
  ): Promise<void> {
    if (!this.pdfDoc) {
      throw new Error('No PDF document loaded');
    }

    const page = await this.pdfDoc.getPage(pageNumber);

    // Get unscaled viewport
    const unscaledViewport = page.getViewport({ scale: 1.0 });

    // Account for device pixel ratio (critical for sharp rendering on high-DPI)
    const devicePixelRatio = window.devicePixelRatio || 1;
    const baseScale = (canvas.clientWidth / unscaledViewport.width) * zoomLevel;
    const scale = baseScale * devicePixelRatio;

    const viewport = page.getViewport({ scale });

    // Set canvas dimensions (physical pixels)
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Set CSS display size (logical pixels)
    canvas.style.height = `${viewport.height / devicePixelRatio}px`;
    canvas.style.width = `${viewport.width / devicePixelRatio}px`;

    const renderContext = {
      canvasContext: canvas.getContext('2d')!,
      viewport,
    };

    await page.render(renderContext).promise;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.pdfDoc) {
      this.pdfDoc.cleanup();
      this.pdfDoc = null;
    }
  }

  /**
   * Check if PDF.js is loaded
   */
  isPdfJsLoaded(): boolean {
    return !!this.pdfjsLib;
  }
}
