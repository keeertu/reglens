import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function AnalysisView({ analysisResult, onBack }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </button>

      <div className="p-6 rounded-xl border bg-card prose prose-invert max-w-none markdown-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {analysisResult?.rawText || "No output received"}
        </ReactMarkdown>
      </div>
    </div>
  );
}