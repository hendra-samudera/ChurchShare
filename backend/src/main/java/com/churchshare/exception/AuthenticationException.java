package com.churchshare.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when authentication fails.
 */
public class AuthenticationException extends AppException {

    public AuthenticationException(String message) {
        super(message, HttpStatus.UNAUTHORIZED, "AUTHENTICATION_FAILED");
    }

    public static AuthenticationException invalidCredentials() {
        return new AuthenticationException("Invalid email or password");
    }

    public static AuthenticationException userInactive() {
        return new AuthenticationException("User account is inactive");
    }

    public static AuthenticationException tokenExpired() {
        return new AuthenticationException("Authentication token has expired");
    }

    public static AuthenticationException tokenInvalid() {
        return new AuthenticationException("Authentication token is invalid");
    }

    public static AuthenticationException missingToken() {
        return new AuthenticationException("Authentication token is missing");
    }
}
