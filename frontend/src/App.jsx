import React, { useState } from 'react';
import { LayoutDashboard, FileText, Activity } from 'lucide-react';
import { StatusBanner } from './components/StatusBanner';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentList } from './components/DocumentList';
import { AnalysisView } from './components/AnalysisView';
import { TaskDashboard } from './components/TaskDashboard';

function App() {
    const [activeTab, setActiveTab] = useState('documents');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [globalError, setGlobalError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // Hack to force re-fetches on retry

    const handleError = (errorMsg) => {
        setGlobalError(errorMsg);
    };

    const clearError = () => {
        setGlobalError(null);
        setRefreshTrigger(prev => prev + 1); // Signal components to retry data fetching if needed
        // Note: Ideally components would listen to this or we pass a key. 
        // Simple way: remount components by key or pass refreshTrigger prop.
    };

    const handleUploadSuccess = () => {
        // Refresh list
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">RegLens</span>
                    </div>

                    <nav className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
                        <button
                            onClick={() => { setActiveTab('documents'); setSelectedDoc(null); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${activeTab === 'documents'
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span>Documents</span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('tasks'); setSelectedDoc(null); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${activeTab === 'tasks'
                                    ? 'bg-slate-700 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Tasks</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                <StatusBanner
                    error={globalError}
                    onRetry={clearError}
                    isLoading={false}
                />

                {activeTab === 'documents' && (
                    selectedDoc ? (
                        <AnalysisView
                            key={selectedDoc.filename} // Remount on change
                            filename={selectedDoc.filename || selectedDoc}
                            onBack={() => setSelectedDoc(null)}
                            onError={handleError}
                        />
                    ) : (
                        <div className="space-y-12">
                            <DocumentUpload
                                onUploadSuccess={handleUploadSuccess}
                                onError={handleError}
                            />
                            <div className="border-t border-slate-800 pt-8">
                                <DocumentList
                                    key={refreshTrigger} // Remount to refetch
                                    onSelectDocument={setSelectedDoc}
                                    onError={handleError}
                                />
                            </div>
                        </div>
                    )
                )}

                {activeTab === 'tasks' && (
                    <TaskDashboard
                        key={refreshTrigger}
                        onError={handleError}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
