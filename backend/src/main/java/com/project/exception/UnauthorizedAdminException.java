package com.project.exception;

/**
 * Thrown whenever an unauthorized admin access attempt is detected.
 * Maps to HTTP 403 via GlobalExceptionHandler.
 */
public class UnauthorizedAdminException extends RuntimeException {

    public UnauthorizedAdminException() {
        super("Unauthorized Admin Access");
    }

    public UnauthorizedAdminException(String message) {
        super(message);
    }
}
