package com.churchshare.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base exception for application-specific errors.
 */
@Getter
public class AppException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public AppException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public AppException(String message, HttpStatus status) {
        this(message, status, "APP_ERROR");
    }
}
