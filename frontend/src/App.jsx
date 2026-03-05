import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import UploadScreen from './components/UploadScreen';
import AnalysisLoadingScreen from './components/AnalysisLoadingScreen';
import ResultsDashboard from './components/ResultsDashboard';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const pageVariants = {
    initial: { clipPath: 'inset(0 100% 0 0)' },
    animate: { clipPath: 'inset(0 0% 0 0)' },
    exit: { clipPath: 'inset(0 0 0 100%)' }
};

const pageTransition = {
    duration: 0.5,
    ease: [0.76, 0, 0.24, 1]
};

function App() {
    const [step, setStep] = useState('upload'); // 'upload' | 'analyzing' | 'results'
    const [analysisData, setAnalysisData] = useState(null);
    const [error, setError] = useState(null);

    const handleStartAnalysis = async (file1, file2) => {
        setStep('analyzing');
        setError(null);

        const formData = new FormData();
        formData.append('old', file1);
        formData.append('new', file2);

        try {
            // Step 1: Analyze documents
            const analyzeRes = await axios.post(`${API_BASE}/analyze`, formData);
            const data = analyzeRes.data;

            // Step 2: Generate tasks from the changes found
            const tasksRes = await axios.post(`${API_BASE}/tasks/generate`, {
                changes: data.changes
            });

            setAnalysisData({
                summary: data.summary,
                changes: data.changes,
                tasks: tasksRes.data.tasks
            });

            // The LoadingScreen handles the transition to 'results' via its own timer 
            // or we could force it here. Let's let the loading screen finish its animation.
        } catch (err) {
            console.error("Analysis failed:", err);
            setError("Analysis failed. Please ensure the backend is running and files are valid.");
            setStep('upload');
        }
    };

    return (
        <>
            <div className="hero-glow"></div>
            <AnimatePresence mode="wait">
                {step === 'upload' && (
                    <motion.div
                        key="upload"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageVariants}
                        transition={pageTransition}
                        style={{ width: '100%', minHeight: '100vh', position: 'relative', zIndex: 1, overflowY: 'auto' }}
                    >
                        <UploadScreen onStartAnalysis={handleStartAnalysis} />
                        {error && (
                            <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--danger)', color: '#fff', padding: '12px 24px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', zIndex: 100 }}>
                                {error}
                            </div>
                        )}
                    </motion.div>
                )}

                {step === 'analyzing' && (
                    <motion.div
                        key="analyzing"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageVariants}
                        transition={pageTransition}
                        style={{ width: '100%', minHeight: '100vh', position: 'relative', zIndex: 1, overflowY: 'auto' }}
                    >
                        <AnalysisLoadingScreen onComplete={() => setStep('results')} isFinished={!!analysisData} />
                    </motion.div>
                )}

                {step === 'results' && (
                    <motion.div
                        key="results"
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={pageVariants}
                        transition={pageTransition}
                        style={{ width: '100%', minHeight: '100vh', position: 'relative', zIndex: 1, overflowY: 'auto' }}
                    >
                        <ResultsDashboard data={analysisData} onRestart={() => setStep('upload')} />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default App;
