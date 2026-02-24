package com.churchshare.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when an uploaded file is invalid.
 */
public class InvalidFileException extends AppException {

    public InvalidFileException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "INVALID_FILE");
    }

    public static InvalidFileException notPdf() {
        return new InvalidFileException("File must be a valid PDF");
    }

    public static InvalidFileException tooLarge(long maxSize) {
        return new InvalidFileException(String.format("File size exceeds maximum allowed size of %d MB", maxSize / (1024 * 1024)));
    }

    public static InvalidFileException empty() {
        return new InvalidFileException("File is empty");
    }

    public static InvalidFileException invalidMimeType(String mimeType) {
        return new InvalidFileException(String.format("Invalid MIME type: %s. Expected application/pdf", mimeType));
    }
}
