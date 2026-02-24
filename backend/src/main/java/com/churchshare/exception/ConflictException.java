package com.churchshare.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a resource conflict occurs (e.g., duplicate slug).
 */
public class ConflictException extends AppException {

    public ConflictException(String message) {
        super(message, HttpStatus.CONFLICT, "RESOURCE_CONFLICT");
    }

    public static ConflictException duplicateSlug(String slug) {
        return new ConflictException(String.format("Slug '%s' already exists for this church", slug));
    }

    public static ConflictException duplicateEmail(String email) {
        return new ConflictException(String.format("Email '%s' already exists for this church", email));
    }
}
