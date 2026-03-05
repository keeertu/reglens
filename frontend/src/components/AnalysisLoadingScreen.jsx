import React, { useState, useEffect } from 'react';

const NODES = [
    { id: 1, label: "Extracting Text", delay: 0 },
    { id: 2, label: "Aligning Sections", delay: 800 },
    { id: 3, label: "Batching to LLM", delay: 1800 },
    { id: 4, label: "Generating Tasks", delay: 3200 }
];

export default function AnalysisLoadingScreen({ onComplete }) {
    const [activeNodes, setActiveNodes] = useState([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Activate nodes based on their delays
        const timeouts = NODES.map(node => {
            return setTimeout(() => {
                setActiveNodes(prev => [...prev, node.id]);
            }, node.delay);
        });

        // Animate progress smoothly over ~4800ms
        const startTime = performance.now();
        const duration = 4800;

        let animationFrame;
        const updateProgress = (currentTime) => {
            const elapsed = currentTime - startTime;
            const t = Math.min(elapsed / duration, 1);

            // easeOutCubic: 1 - Math.pow(1 - t, 3)
            // linear could just be: const easedT = t;
            // We'll just do a cubic-bezier-like approximation or just use standard timing 
            // The CSS bar uses cubic-bezier, we can just do a linear count for the text, or simple ease
            const p = Math.floor(t * 100);
            setProgress(p);

            if (t < 1) {
                animationFrame = requestAnimationFrame(updateProgress);
            }
        };
        animationFrame = requestAnimationFrame(updateProgress);

        // Auto advance after 5200ms
        const completeTimeout = setTimeout(() => {
            if (onComplete) onComplete();
        }, 5200);

        return () => {
            timeouts.forEach(clearTimeout);
            clearTimeout(completeTimeout);
            cancelAnimationFrame(animationFrame);
        };
    }, [onComplete]);

    // Generate some random particles for the background
    const particles = Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${50 + Math.random() * 50}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${3 + Math.random() * 3}s`
    }));

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-deep)' }}>

            {/* Top Left Logo */}
            <div style={{ position: 'absolute', top: '32px', left: '40px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 20 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', color: 'var(--accent)' }}>RL</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '16px', color: '#fff' }}>RegLens</span>
            </div>

            {/* Background Document Ghost */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.1 }}>
                <div style={{ position: 'relative', width: '280px', height: '360px', border: '1px solid #1e2128', borderRadius: '4px', padding: '24px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ height: '8px', width: '100%', backgroundColor: '#fff', opacity: 0.2, borderRadius: '4px' }} />
                        <div style={{ height: '8px', width: '85%', backgroundColor: '#fff', opacity: 0.2, borderRadius: '4px' }} />
                        <div style={{ height: '8px', width: '90%', backgroundColor: '#fff', opacity: 0.2, borderRadius: '4px' }} />
                        <div style={{ height: '8px', width: '60%', backgroundColor: '#fff', opacity: 0.2, borderRadius: '4px' }} />
                        <div style={{ height: '8px', width: '95%', backgroundColor: '#fff', opacity: 0.2, borderRadius: '4px', marginTop: '16px' }} />
                        <div style={{ height: '8px', width: '70%', backgroundColor: '#fff', opacity: 0.2, borderRadius: '4px' }} />
                        <div style={{ height: '8px', width: '80%', backgroundColor: '#fff', opacity: 0.2, borderRadius: '4px' }} />
                        <div style={{ height: '8px', width: '50%', backgroundColor: '#fff', opacity: 0.2, borderRadius: '4px' }} />
                    </div>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'linear-gradient(to bottom, transparent, rgba(14,165,233,0.2) 50%, transparent)',
                        animation: 'scanLine 2s linear infinite'
                    }} />
                </div>
            </div>

            {/* Particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent)',
                        opacity: 0.3,
                        left: p.left,
                        top: p.top,
                        animation: `floatUp ${p.animationDuration} infinite ease-in ${p.animationDelay}`
                    }}
                />
            ))}

            {/* Nodes */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 10, marginBottom: '64px' }}>
                {NODES.map((node, index) => {
                    const isActive = activeNodes.includes(node.id);
                    const isConnected = index > 0 && activeNodes.includes(node.id);

                    return (
                        <React.Fragment key={node.id}>
                            {index > 0 && (
                                <div style={{ width: '80px', height: '2px', backgroundColor: 'var(--border)', margin: '14px 16px', position: 'relative' }}>
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--accent)',
                                        width: isConnected ? '100%' : '0%', transition: 'width 0.4s ease'
                                    }} />
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%', border: '2px solid',
                                    borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                                    backgroundColor: isActive ? 'var(--accent)' : 'var(--surface2)',
                                    boxShadow: isActive ? '0 0 16px rgba(14,165,233,0.5)' : 'none',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {isActive && <div style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%' }} />}
                                </div>
                                <div style={{
                                    marginTop: '16px', fontSize: '13px', fontWeight: 600, textAlign: 'center',
                                    color: isActive ? 'var(--text)' : 'var(--text-muted)', transition: 'color 0.3s ease'
                                }}>
                                    {node.label}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Progress Bar fixed at bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%' }}>
                <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-muted)' }}>ANALYSIS IN PROGRESS</span>
                    <span style={{ color: 'var(--accent)' }}>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border)', position: 'relative' }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: 'var(--accent)',
                        animation: 'fillProgress 4.8s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                    }} />
                </div>
            </div>

            {/* Inline style for the fill animation not yet in index.css */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fillProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}} />
        </div>
    );
}
