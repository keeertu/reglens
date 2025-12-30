const BACKEND_URL = "http://localhost:8000";

export const api = {
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

      // 🔑 ADAPT BACKEND → FRONTEND
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
};
