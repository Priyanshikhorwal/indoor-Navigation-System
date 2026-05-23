import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

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
