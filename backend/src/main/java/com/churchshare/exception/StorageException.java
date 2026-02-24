package com.churchshare.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when storage operations fail.
 */
public class StorageException extends AppException {

    public StorageException(String message) {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR, "STORAGE_ERROR");
    }

    public StorageException(String message, Throwable cause) {
        super(message + ": " + cause.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, "STORAGE_ERROR");
    }

    public static StorageException uploadFailed(String reason) {
        return new StorageException("Failed to upload file: " + reason);
    }

    public static StorageException deleteFailed(String fileKey) {
        return new StorageException("Failed to delete file: " + fileKey);
    }

    public static StorageException fileNotFound(String fileKey) {
        return new StorageException("File not found in storage: " + fileKey, HttpStatus.NOT_FOUND, "STORAGE_FILE_NOT_FOUND");
    }
}
