const BACKEND_URL = "http://localhost:8000";

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`);
    const data = await res.json();
    return { data };
  },

  analyzeFiles: async (oldFile, newFile) => {
    try {
      const formData = new FormData();
      formData.append("old", oldFile);
      formData.append("new", newFile);

      const res = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Backend error");
      }

      const json = await res.json();

      return {
        data: {
          rawText: json.summary || "",
          hasChanges: (json.changes && json.changes.length > 0),
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
    const res = await fetch(`${BACKEND_URL}/tasks/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes }),
    });
    return res.json();
  },

  getTasks: async () => {
    const res = await fetch(`${BACKEND_URL}/tasks`);
    const json = await res.json();
    return { tasks: json.tasks };
  },

  approveTask: async (taskId) => {
    const res = await fetch(`${BACKEND_URL}/tasks/${taskId}/approve`, {
      method: "POST",
    });
    return res.json();
  },

  rejectTask: async (taskId) => {
    const res = await fetch(`${BACKEND_URL}/tasks/${taskId}/reject`, {
      method: "POST",
    });
    return res.json();
  },

  exportTasksPdf: async (regulationName = "RegLens Compliance Report") => {
    const url = new URL(`${BACKEND_URL}/tasks/export`);
    url.searchParams.append("regulation_name", regulationName);

    const res = await fetch(url);
    if (!res.ok) throw new Error("Export failed");
    return res.blob();
  },
};

export default api;
