import React, { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export function DocumentUpload({ onAnalysisComplete, onError }) {
    const [oldFile, setOldFile] = useState(null);
    const [newFile, setNewFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleOldFileChange = (e) => {
        if (e.target.files[0]) setOldFile(e.target.files[0]);
    };

    const handleNewFileChange = (e) => {
        if (e.target.files[0]) setNewFile(e.target.files[0]);
    };

    const handleAnalyze = async () => {
        if (!oldFile || !newFile) return;

        setIsAnalyzing(true);
        const { data, error } = await api.analyzeFiles(oldFile, newFile);
        setIsAnalyzing(false);

        if (error) {
            onError(error);
        } else {
            onAnalysisComplete(data);
        }
    };

    return (
        <div className="p-8 rounded-2xl border border-border bg-card/60 backdrop-blur-xl max-w-2xl mx-auto text-center shadow-xl">
            <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-inner">
                    <Upload className="w-8 h-8 text-primary" />
                </div>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-2">Compare Regulations</h2>
            <p className="text-muted-foreground mb-8">Upload the old and new versions of the regulation to analyze changes.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-muted-foreground">Old Regulation</label>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".txt,.pdf,.md"
                            onChange={handleOldFileChange}
                            className="hidden"
                            id="old-file-upload"
                            disabled={isAnalyzing}
                        />
                        <label
                            htmlFor="old-file-upload"
                            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer h-32
                                ${oldFile
                                    ? 'border-primary/50 bg-primary/5 text-primary'
                                    : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <FileText className="w-6 h-6 mb-2" />
                            <span className="text-xs truncate max-w-[150px]">{oldFile ? oldFile.name : 'Choose Old Version'}</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-muted-foreground">New Regulation</label>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".txt,.pdf,.md"
                            onChange={handleNewFileChange}
                            className="hidden"
                            id="new-file-upload"
                            disabled={isAnalyzing}
                        />
                        <label
                            htmlFor="new-file-upload"
                            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer h-32
                                ${newFile
                                    ? 'border-primary/50 bg-primary/5 text-primary'
                                    : 'border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <FileText className="w-6 h-6 mb-2" />
                            <span className="text-xs truncate max-w-[150px]">{newFile ? newFile.name : 'Choose New Version'}</span>
                        </label>
                    </div>
                </div>
            </div>

            <button
                onClick={handleAnalyze}
                disabled={!oldFile || !newFile || isAnalyzing}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed
                            text-primary-foreground font-medium rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Running Deep Analysis...</span>
                    </>
                ) : (
                    <span>Analyze Differences</span>
                )}
            </button>
        </div>
    );
}
