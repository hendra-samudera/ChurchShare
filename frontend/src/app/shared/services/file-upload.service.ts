import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockDataService } from './mock-data.service';

export interface UploadProgress {
  type: 'progress';
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadSuccess {
  type: 'success';
  slotId: string;
  permanentUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface UploadError {
  type: 'error';
  message: string;
  code: string;
}

export type UploadEvent = UploadProgress | UploadSuccess | UploadError;

export interface UploadValidationResult {
  valid: boolean;
  error?: {
    code: 'INVALID_TYPE' | 'FILE_TOO_LARGE' | 'FILE_EMPTY';
    message: string;
  };
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private readonly mockData = inject(MockDataService);
  
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per PRD
  private readonly ALLOWED_TYPES = ['application/pdf'];

  /**
   * Validate file before upload
   * Returns synchronously - no network call
   */
  validateFile(file: File): UploadValidationResult {
    if (file.size === 0) {
      return {
        valid: false,
        error: {
          code: 'FILE_EMPTY',
          message: 'The selected file is empty. Please select a valid PDF.',
        },
      };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Only PDF files are allowed. Please select a PDF document.',
        },
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File is too large. Maximum size is ${this.formatFileSize(this.MAX_FILE_SIZE)}.`,
        },
      };
    }

    return { valid: true };
  }

  /**
   * Upload file to slot with simulated progress
   * Uses setTimeout to simulate real upload progress
   */
  uploadToSlot(slotId: string, file: File): Observable<UploadEvent> {
    return new Observable<UploadEvent>(observer => {
      let progress = 0;
      const total = file.size;
      
      // Simulate upload progress in chunks
      const interval = setInterval(() => {
        // Random progress increment (20-40% per interval)
        const increment = Math.random() * 20 + 20;
        progress = Math.min(progress + increment, 100);
        
        const loaded = Math.floor((progress / 100) * total);
        
        observer.next({
          type: 'progress',
          loaded,
          total,
          percentage: Math.round(progress),
        });

        if (progress >= 100) {
          clearInterval(interval);
          
          // Simulate final processing delay
          setTimeout(() => {
            const now = new Date().toISOString();
            
            // Update mock data
            this.mockData.updateSlot(slotId, {
              hasFile: true,
              lastUpdatedAt: now,
              lastUpdatedBy: 'Admin User',
              fileSize: file.size,
              originalFilename: file.name,
            });

            const slot = this.mockData.getSlotById(slotId);
            
            observer.next({
              type: 'success',
              slotId,
              permanentUrl: slot?.permanentUrl || '',
              fileName: file.name,
              fileSize: file.size,
              uploadedAt: now,
            });
            
            observer.complete();
          }, 500);
        }
      }, 300); // Update every 300ms

      // Cleanup function for cancellation
      return () => {
        clearInterval(interval);
      };
    });
  }

  /**
   * Get human-readable file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
