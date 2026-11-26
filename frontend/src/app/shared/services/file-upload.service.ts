import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Slot } from '@models/slot.model';
import { environment } from '@environments/environment';

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
  private readonly http = inject(HttpClient);

  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per PRD
  private readonly ALLOWED_TYPES = ['application/pdf'];

  /**
   * Validate file before upload - no network call
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
   * Upload file to slot with real progress tracking
   */
  uploadToSlot(slotId: string, file: File): Observable<UploadEvent> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${environment.apiUrl}/admin/slots/${slotId}/upload`;

    return this.http
      .post<Slot>(url, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((event): UploadEvent => {
          switch (event.type) {
            case HttpEventType.UploadProgress: {
              const total = event.total ?? file.size;
              const loaded = event.loaded;
              return {
                type: 'progress',
                loaded,
                total,
                percentage: Math.round((loaded / total) * 100),
              };
            }
            case HttpEventType.Response: {
              const slot = event.body;
              return {
                type: 'success',
                slotId,
                permanentUrl: slot?.permanentUrl ?? '',
                fileName: file.name,
                fileSize: file.size,
                uploadedAt: slot?.lastUpdatedAt ?? new Date().toISOString(),
              };
            }
            default:
              return { type: 'progress', loaded: 0, total: file.size, percentage: 0 };
          }
        }),
        catchError((err: HttpErrorResponse) => {
          const message = err.error?.message || 'Upload failed. Please try again.';
          return new Observable<UploadEvent>((observer) => {
            observer.next({ type: 'error', message, code: `HTTP_${err.status}` });
            observer.complete();
          });
        })
      );
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
