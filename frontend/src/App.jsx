import React, { useState } from 'react';
import { LayoutDashboard, FileText, Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50 supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                            <Activity className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">RegLens</span>
                    </div>

                    <nav className="flex space-x-1 bg-secondary/50 p-1 rounded-xl border border-border/50">
                        <button
                            onClick={() => { setActiveTab('documents'); setSelectedDoc(null); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${activeTab === 'documents'
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span>Documents</span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('tasks'); setSelectedDoc(null); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${activeTab === 'tasks'
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
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

                <AnimatePresence mode="wait">
                    {activeTab === 'documents' && (
                        <motion.div
                            key="documents"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* 
                                Logic Change:
                                If we have an analysis result, show the AnalysisView.
                                Otherwise show the DocumentUpload (Dual File).
                                We are moving away from "List Documents" -> "Select" flow for this integration.
                            */}
                            {selectedDoc ? ( // re-using selectedDoc as the state holder for the RESULT object for simplicity
                                <AnalysisView
                                    analysisResult={selectedDoc} // passing the full object
                                    onBack={() => setSelectedDoc(null)}
                                />
                            ) : (
                                <div className="space-y-12">
                                    <DocumentUpload
                                        onAnalysisComplete={(data) => {
                                            setSelectedDoc(data); // data is the analysis object
                                        }}
                                        onError={handleError}
                                    />
                                    {/* Removed DocumentList as it's not part of the specific integration prompt flow */}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'tasks' && (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TaskDashboard
                                key={refreshTrigger}
                                onError={handleError}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

export default App;
