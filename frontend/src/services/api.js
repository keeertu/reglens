// Production-hardened API layer for RegLens
// Normalizes URL, forces CORS mode, and handles network failures gracefully.

const RAW_URL = import.meta.env.VITE_API_URL || "https://reglens-sgxn.onrender.com";
// Strip trailing slashes to prevent double-slash issues (e.g. /api//analyze)
const BACKEND_URL = RAW_URL.replace(/\/+$/, "");

/**
 * Central fetch wrapper that enforces CORS mode and catches network-level failures.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<Response>}
 */
async function safeFetch(url, options = {}) {
  const finalOptions = {
    mode: "cors",
    credentials: "omit", // Explicitly omit cookies for cross-origin
    ...options,
  };
  try {
    return await fetch(url, finalOptions);
  } catch (networkErr) {
    // NetworkError (DNS, refused, offline, CORS preflight block)
    throw new Error(`Network request failed: ${networkErr.message || "Unknown network error"}`);
  }
}

export const api = {
  get: async (endpoint) => {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const res = await safeFetch(`${BACKEND_URL}${normalizedEndpoint}`);
    const data = await res.json();
    return { data };
  },

  analyzeFiles: async (oldFile, newFile) => {
    try {
      const formData = new FormData();
      formData.append("old", oldFile);
      formData.append("new", newFile);

      const res = await safeFetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        body: formData,
        // Note: Do NOT set Content-Type for FormData; browser sets it with boundary
      });

      if (!res.ok) {
        let errText;
        try {
          errText = await res.text();
        } catch {
          errText = `HTTP ${res.status}`;
        }
        throw new Error(errText || `Backend error (HTTP ${res.status})`);
      }

      const json = await res.json();

      return {
        data: {
          rawText: json.summary || "",
          hasChanges: Array.isArray(json.changes) && json.changes.length > 0,
          changes: json.changes || [],
        },
        error: null,
      };

    } catch (err) {
      return {
        data: null,
        error: err.message || "Network error",
      };
    }
  },

  generateTasks: async (changes) => {
    const res = await safeFetch(`${BACKEND_URL}/tasks/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes }),
    });
    return res.json();
  },

  getTasks: async () => {
    const res = await safeFetch(`${BACKEND_URL}/tasks`);
    const json = await res.json();
    return { tasks: json.tasks };
  },

  approveTask: async (taskId) => {
    const res = await safeFetch(`${BACKEND_URL}/tasks/${taskId}/approve`, {
      method: "POST",
    });
    return res.json();
  },

  rejectTask: async (taskId) => {
    const res = await safeFetch(`${BACKEND_URL}/tasks/${taskId}/reject`, {
      method: "POST",
    });
    return res.json();
  },

  exportTasksPdf: async (regulationName = "RegLens Compliance Report") => {
    const url = new URL(`${BACKEND_URL}/tasks/export`);
    url.searchParams.append("regulation_name", regulationName);

    const res = await safeFetch(url.toString());
    if (!res.ok) throw new Error("Export failed");
    return res.blob();
  },
};

export default api;
