import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to handle errors gracefully
const handleRequest = async (request) => {
    try {
        const response = await request();
        return { data: response.data, error: null };
    } catch (error) {
        console.error("API Error:", error);
        if (error.code === 'ERR_NETWORK') {
            return { data: null, error: "Backend unreachable. Please ensure the server is running." };
        }

        // Extract error message safely
        let errorMsg = "An unexpected error occurred";
        const detail = error.response?.data?.detail;

        if (detail) {
            if (Array.isArray(detail)) {
                // FastAPI validation error (array of objects)
                errorMsg = detail.map(e => e.msg).join('; ');
            } else if (typeof detail === 'object') {
                errorMsg = JSON.stringify(detail);
            } else {
                errorMsg = String(detail);
            }
        } else if (error.message) {
            errorMsg = error.message;
        }

        return {
            data: null,
            error: errorMsg
        };
    }
};

export const api = {
    upload: (file, title = "Uploaded Document", version = "v1.0") => handleRequest(() => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('version', version);
        return apiClient.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }),
    listDocuments: () => handleRequest(() => apiClient.get('/documents/list')),
    analyze: (filename) => handleRequest(() => apiClient.get(`/analyze/${filename}`)),
    getTasks: () => handleRequest(() => apiClient.get('/tasks/mock')),
    approveTask: (taskId) => handleRequest(() => apiClient.post(`/tasks/${taskId}/approve`)),
    checkHealth: () => handleRequest(() => apiClient.get('/health')),
};
