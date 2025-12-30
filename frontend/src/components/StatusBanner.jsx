import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function StatusBanner({ error, onRetry, isLoading }) {
    if (!error) return null;

    const errorMessage = typeof error === 'string' ? error : JSON.stringify(error);

    return (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center space-x-3 text-red-200">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="font-medium">{errorMessage}</span>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-md transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Retry Connection</span>
                </button>
            )}
        </div>
    );
}
