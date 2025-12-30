import React, { useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export function DocumentUpload({ onUploadSuccess, onError }) {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        const { data, error } = await api.upload(file, file.name, "v1.0");
        setIsUploading(false);

        if (error) {
            onError(error);
        } else {
            setFile(null);
            onUploadSuccess();
        }
    };

    return (
        <div className="glass-panel p-8 rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm max-w-xl mx-auto text-center">
            <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                    <Upload className="w-8 h-8 text-blue-400" />
                </div>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-2">Upload Regulatory Document</h2>
            <p className="text-slate-400 mb-8">Select a PDF document to analyze for compliance risks.</p>

            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        disabled={isUploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`flex items-center justify-center space-x-2 w-full p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer
                            ${file
                                ? 'border-blue-500/50 bg-blue-500/5 text-blue-200'
                                : 'border-slate-600 hover:border-slate-500 text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        <FileText className="w-5 h-5" />
                        <span>{file ? file.name : 'Choose PDF file'}</span>
                    </label>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed
                             text-white font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <span>Start Analysis</span>
                    )}
                </button>
            </div>
        </div>
    );
}
