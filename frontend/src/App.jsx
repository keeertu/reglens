import React, { useState } from 'react';
import { LayoutDashboard, FileText, Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { StatusBanner } from './components/StatusBanner';
import { DocumentUpload } from './components/DocumentUpload';
import { AnalysisView } from './components/AnalysisView';
import { TaskDashboard } from './components/TaskDashboard';

function App() {
    const [activeTab, setActiveTab] = useState('documents');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [globalError, setGlobalError] = useState(null);

    const handleError = (errorMsg) => {
        setGlobalError(errorMsg);
    };

    const clearError = () => {
        setGlobalError(null);
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold">RegLens</span>
                    </div>

                    <nav className="flex space-x-1 bg-secondary/50 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-4 py-2 rounded-lg text-sm ${
                                activeTab === 'documents'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            <FileText className="inline w-4 h-4 mr-1" />
                            Documents
                        </button>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`px-4 py-2 rounded-lg text-sm ${
                                activeTab === 'tasks'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground'
                            }`}
                        >
                            <LayoutDashboard className="inline w-4 h-4 mr-1" />
                            Tasks
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                <StatusBanner error={globalError} onRetry={clearError} isLoading={false} />

                <AnimatePresence mode="wait">
                    {activeTab === 'documents' && (
                        <motion.div
                            key="documents"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {analysisResult ? (
                                <AnalysisView
                                    analysisResult={analysisResult}
                                    onBack={() => setAnalysisResult(null)}
                                />
                            ) : (
                                <DocumentUpload
                                    onAnalysisComplete={(data) => {
                                        setAnalysisResult(data);
                                    }}
                                    onError={handleError}
                                />
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'tasks' && (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <TaskDashboard
                                analysis={analysisResult}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

export default App;
