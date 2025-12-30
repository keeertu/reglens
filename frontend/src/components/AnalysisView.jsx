import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export function AnalysisView({ filename, onBack, onError }) {
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            setIsLoading(true);
            const { data, error } = await api.analyze(filename);
            setIsLoading(false);

            if (error) {
                onError(error);
            } else {
                setAnalysis(data);
            }
        };

        if (filename) {
            fetchAnalysis();
        }
    }, [filename]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-slate-400">Analyzing regulatory content...</p>
            </div>
        );
    }

    if (!analysis) return null;

    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Documents</span>
            </button>

            <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-800/50">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{filename}</h2>
                        <span className="text-sm text-slate-400">Analysis Report</span>
                    </div>
                    {analysis.score !== undefined && (
                        <div className={`px-4 py-2 rounded-lg border ${analysis.score > 70 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                            }`}>
                            <span className="text-sm font-semibold">Compliance Score: {analysis.score}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Summary Section */}
                    {analysis.summary && (
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-slate-200">Executive Summary</h3>
                            <p className="text-slate-300 leading-relaxed">{analysis.summary}</p>
                        </div>
                    )}

                    {/* Risks Section */}
                    {analysis.risks && analysis.risks.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-slate-200">Identify Risks</h3>
                            <div className="grid gap-3">
                                {analysis.risks.map((risk, idx) => (
                                    <div key={idx} className="flex gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-red-200">{risk.title || "Risk Item"}</p>
                                            <p className="text-sm text-red-200/70">{risk.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
