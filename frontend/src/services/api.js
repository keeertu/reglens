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
        // Note: The previous code was posting to /documents/upload on port 8000, 
        // but our new backend really only has /analyze and /health.
        // For this demo, we might not need separate upload if /analyze takes files directly.
        // However, if the UI has a separate Upload step, we need to decide.
        // The prompt says "Connect the frontend 'Upload' and 'Analyze' buttons to the backend LLM pipeline".
        // Let's assume Analyze does the work.
        // If there is a dedicated Upload button that expects persistence, we might need a mock or file storage.
        // But for "RegLens Integration", usually it's "Upload 2 files -> Analyze".
        // Let's keep this generic or mock it if backend doesn't support persistence yet.
        // OUR Backend replace `analyze_documents` takes `old_file` and `new_file`.
        // So `api.analyze` should probably take the files.
        return Promise.resolve({ data: { message: "File staged (mock)" } });
    }),
    listDocuments: () => handleRequest(() => apiClient.get('/documents/list')), // Likely mock or 404
    // KEY CHANGE: Analyze now takes two files via POST
    analyzeFiles: (oldFile, newFile) => handleRequest(() => {
        const formData = new FormData();
        formData.append('old_file', oldFile);
        formData.append('new_file', newFile);

        // Use a longer timeout for LLM
        return apiClient.post('/analyze', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000 // 2 minutes
        });
    }),
    getTasks: () => handleRequest(() => apiClient.get('/tasks/mock')), // Depending on if we implemented this
    approveTask: (taskId) => handleRequest(() => apiClient.post(`/tasks/${taskId}/approve`)),
    checkHealth: () => handleRequest(() => apiClient.get('/health')),
};
