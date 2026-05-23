import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

// ─── Request interceptor: attach JWT to every request ────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// ─── Response interceptor: clear stale tokens on 401 ────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — clear auth state
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('email');
            // Redirect to the appropriate login page
            const role = localStorage.getItem('role');
            if (role === 'ROLE_ADMIN' || window.location.pathname.startsWith('/admin')) {
                window.location.href = '/admin/login';
            } else {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ─── Admin Authentication ─────────────────────────────────────────────────────

/**
 * Dedicated admin login — calls /api/auth/admin/login.
 * Returns 403 "Unauthorized Admin Access" for any non-admin credentials.
 */
api.adminLogin = (email, password) => {
    return api.post('/auth/admin/login', { email, password });
};

// ─── File Upload Helpers ──────────────────────────────────────────────────────

api.uploadCAD = (formData, onProgress) => {
    return api.post('/admin/cad/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress,
    });
};

api.getUploadStatus = (uploadId) => {
    return api.get(`/admin/cad/status/${uploadId}`);
};

// ─── Navigation Data Helpers ──────────────────────────────────────────────────

api.getRooms = () => {
    return api.get('/rooms').then(res => res.data);
};

api.getNodes = () => {
    return api.get('/nodes').then(res => res.data);
};

api.getEdges = () => {
    return api.get('/edges').then(res => res.data);
};

api.getFloors = () => {
    return api.get('/floors').then((res) => res.data);
};

api.getRoute = ({ sourceId, destinationId, wheelchairAccessible }) => {
    return api.post('/shortest-path', { sourceId, destinationId, wheelchairAccessible }).then(res => res.data);
};

export default api;
