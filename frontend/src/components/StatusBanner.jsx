import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function StatusBanner({ error, onRetry, isLoading }) {
    if (!error) return null;

    const errorMessage = typeof error === 'string' ? error : JSON.stringify(error);

    return (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex items-center justify-between backdrop-blur-sm shadow-sm">
            <div className="flex items-center space-x-3 text-destructive">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="font-medium">{errorMessage}</span>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-md transition-colors disabled:opacity-50 font-medium text-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Retry Connection</span>
                </button>
            )}
        </div>
    );
}
