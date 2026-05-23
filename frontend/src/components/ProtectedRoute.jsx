import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Guards routes by checking JWT token and role from localStorage.
 * - Admin routes (ROLE_ADMIN) redirect to /admin/login when unauthorized.
 * - User routes (ROLE_USER) redirect to /login when unauthorized.
 */
const ProtectedRoute = ({ children, requiredRole }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // No token at all — redirect to the appropriate login page
    if (!token) {
        if (requiredRole === 'ROLE_ADMIN') {
            return <Navigate to="/admin/login" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // Token exists but role doesn't match
    if (requiredRole && role !== requiredRole) {
        if (requiredRole === 'ROLE_ADMIN') {
            // Non-admin trying to access admin routes
            return <Navigate to="/admin/login" replace />;
        }
        // Admin trying to access user routes — send to their dashboard
        if (role === 'ROLE_ADMIN') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
