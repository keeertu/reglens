export function AnalysisView({ analysisResult, onBack }) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
  
        <div className="p-6 rounded-xl border bg-card whitespace-pre-wrap font-mono text-sm">
          {analysisResult?.rawText || "No output received"}
        </div>
      </div>
    );
  }
  