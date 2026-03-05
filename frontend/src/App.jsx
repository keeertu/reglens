import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import UploadScreen from './components/UploadScreen';
import AnalysisLoadingScreen from './components/AnalysisLoadingScreen';
import ResultsDashboard from './components/ResultsDashboard';

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
                        <UploadScreen onStartAnalysis={() => setStep('analyzing')} />
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
                        <AnalysisLoadingScreen onComplete={() => setStep('results')} />
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
                        <ResultsDashboard />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default App;
