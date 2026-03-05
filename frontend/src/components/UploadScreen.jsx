import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// --- NETWORK GRAPH BACKGROUND ---
const NetworkGraph = () => {
    const [nodes, setNodes] = useState([]);

    useEffect(() => {
        // Generate ~30 random nodes
        const newNodes = Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100, // %
            y: Math.random() * 100, // %
            duration: 8 + Math.random() * 8, // 8-16s
            delay: Math.random() * -10, // negative delay so they start out-of-sync
            tx: (Math.random() - 0.5) * 30, // translateX
            ty: (Math.random() - 0.5) * 30, // translateY
        }));
        setNodes(newNodes);
    }, []);

    // Generate lines between close nodes
    const lines = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 15) {
                lines.push({ id: `${i}-${j}`, start: nodes[i], end: nodes[j] });
            }
        }
    }

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                {/* Draw lines */}
                {lines.map(line => (
                    <motion.line
                        key={line.id}
                        stroke="#141825"
                        strokeWidth="1"
                        initial={{
                            x1: `${line.start.x}%`,
                            y1: `${line.start.y}%`,
                            x2: `${line.end.x}%`,
                            y2: `${line.end.y}%`
                        }}
                        animate={{
                            x1: `calc(${line.start.x}% + ${line.start.tx}px)`,
                            y1: `calc(${line.start.y}% + ${line.start.ty}px)`,
                            x2: `calc(${line.end.x}% + ${line.end.tx}px)`,
                            y2: `calc(${line.end.y}% + ${line.end.ty}px)`,
                        }}
                        transition={{
                            duration: Math.max(line.start.duration, line.end.duration),
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut"
                        }}
                    />
                ))}
                {/* Draw nodes */}
                {nodes.map(node => (
                    <motion.circle
                        key={node.id}
                        r="1.5"
                        fill="#1e2535"
                        initial={{ cx: `${node.x}%`, cy: `${node.y}%` }}
                        animate={{
                            cx: `calc(${node.x}% + ${node.tx}px)`,
                            cy: `calc(${node.y}% + ${node.ty}px)`,
                        }}
                        transition={{
                            duration: node.duration,
                            delay: node.delay,
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </svg>
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                background: 'radial-gradient(ellipse 800px 500px at 50% 30%, rgba(14,165,233,0.07) 0%, transparent 70%)'
            }} />
        </div>
    );
};


// --- UPLOAD ZONES ---
function DropZone({ label, file, onDrop }) {
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => { e.preventDefault(); setIsHovered(true); };
    const handleDragLeave = () => { setIsHovered(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsHovered(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) onDrop(e.dataTransfer.files[0]);
    };
    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) onDrop(e.target.files[0]);
    };

    return (
        <div
            style={{
                position: 'relative',
                height: '200px',
                backgroundColor: isHovered ? 'rgba(14,165,233,0.04)' : '#0b0d14',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isHovered ? 'inset 0 0 40px rgba(14,165,233,0.06)' : 'none',
                overflow: 'hidden'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input type="file" ref={fileInputRef} onChange={handleChange} accept=".pdf" style={{ display: 'none' }} />

            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: '10px' }}>
                <rect
                    x="0.5" y="0.5"
                    style={{
                        width: 'calc(100% - 1px)',
                        height: 'calc(100% - 1px)',
                        transition: 'stroke 0.2s ease'
                    }}
                    fill="none"
                    stroke={isHovered ? '#0ea5e9' : '#1a1d27'}
                    strokeWidth="1"
                    strokeDasharray={isHovered ? 'none' : '4 4'}
                    rx="10" ry="10"
                />
            </svg>

            {!file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <div style={{ position: 'absolute', top: '16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {label}
                    </div>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e2535" strokeWidth="1.5" style={{ marginBottom: '12px', marginTop: '16px' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#2d3348', marginBottom: '4px' }}>Drop PDF or click to browse</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#1e2535' }}>Supported: PDF up to 200MB</span>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <div style={{ position: 'relative', width: '100px', height: '130px', backgroundColor: '#fff', borderRadius: '4px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', marginBottom: '16px' }}>
                        <div style={{ height: '4px', width: '100%', backgroundColor: '#1a1d27', opacity: 0.1, borderRadius: '2px' }}></div>
                        <div style={{ height: '4px', width: '80%', backgroundColor: '#1a1d27', opacity: 0.1, borderRadius: '2px' }}></div>
                        <div style={{ height: '4px', width: '90%', backgroundColor: '#1a1d27', opacity: 0.1, borderRadius: '2px' }}></div>
                        <div style={{ height: '4px', width: '60%', backgroundColor: '#1a1d27', opacity: 0.1, borderRadius: '2px' }}></div>
                        <div style={{ height: '4px', width: '75%', backgroundColor: '#1a1d27', opacity: 0.1, borderRadius: '2px' }}></div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#fff', borderRadius: '50%' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--success)" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" fill="var(--success)"></circle>
                                <polyline points="16 10 11 15 8 12" stroke="#fff"></polyline>
                            </svg>
                        </motion.div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#0ea5e9', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                        {file.name}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#2d3348' }}>
                        ~12 pages · PDF
                    </div>
                </div>
            )}
        </div>
    );
}

const STAT_CHIPS = [
    { id: 1, text: "2.3M+ regulations tracked", icon: "📋", top: "-20%", left: "-10%", rot: "-2deg", bg: "#0c1420", border: "#1e3a5f", color: "#e8eaf0", delay: "0s" },
    { id: 2, text: "$4.5B in fines issued in 2024", icon: "⚠️", top: "-10%", right: "-15%", rot: "3deg", bg: "#1a0a00", border: "#3d1f00", color: "#fb923c", delay: "1s" },
    { id: 3, text: "94% faster review cycles", icon: "⚡", bottom: "-15%", left: "-12%", rot: "2deg", bg: "#001a0d", border: "#003d1a", color: "#4ade80", delay: "2s" },
    { id: 4, text: "Zero hallucination compliance", icon: "🛡️", bottom: "-25%", right: "-5%", rot: "-1deg", bg: "#0a0020", border: "#1e0050", color: "#a78bfa", delay: "0.5s" },
]

export default function UploadScreen({ onStartAnalysis }) {
    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);

    const bothFilesLoaded = file1 && file2;

    const handleStart = () => {
        if (bothFilesLoaded) {
            onStartAnalysis(file1, file2);
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', backgroundColor: 'var(--bg-deep)', overflowX: 'hidden' }}>
            <NetworkGraph />

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulseShadow {
          0%, 100% { box-shadow: 0 0 20px rgba(14,165,233,0.3); }
          50% { box-shadow: 0 0 40px rgba(14,165,233,0.5); }
        }
        .compare-btn {
          transition: all 150ms ease !important;
        }
        .compare-btn:not(:disabled):hover {
          background-color: #0284c7 !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(14,165,233,0.35) !important;
        }
        .compare-btn:not(:disabled):active {
          transform: translateY(0px);
          box-shadow: 0 4px 16px rgba(14,165,233,0.2) !important;
        }
        .compare-btn-icon {
          transition: transform 0.2s ease;
        }
        .compare-btn:not(:disabled):hover .compare-btn-icon {
          transform: translateX(4px);
        }
      `}} />

            <div style={{ position: 'absolute', top: '32px', left: '40px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', color: 'var(--accent)' }}>RL</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '16px', color: '#fff' }}>RegLens</span>
            </div>

            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '8vh', paddingBottom: '100px' }}>
                <div style={{ position: 'relative', textAlign: 'center', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        backgroundColor: '#0f1827', border: '1px solid #1e3a5f', borderRadius: '20px',
                        padding: '6px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
                        color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px'
                    }}>
                        AI-POWERED REGULATORY INTELLIGENCE
                    </div>
                    <h1 style={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '56px',
                        lineHeight: 1.1, color: '#fff', marginBottom: '24px', position: 'relative'
                    }}>
                        Detect Every Change.<br />
                        Before It <span style={{ color: 'var(--accent)' }}>Costs You.</span>
                        {STAT_CHIPS.map(chip => (
                            <div key={chip.id} style={{
                                position: 'absolute',
                                top: chip.top, bottom: chip.bottom, left: chip.left, right: chip.right,
                                backgroundColor: chip.bg, border: `1px solid ${chip.border}`,
                                padding: '8px 14px', borderRadius: '8px', zIndex: -1,
                                display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
                                transform: `rotate(${chip.rot})`,
                                animation: `subtleFloat 4s ease-in-out infinite`,
                                animationDelay: chip.delay
                            }}>
                                <span style={{ fontSize: '14px' }}>{chip.icon}</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: chip.color, fontWeight: 500 }}>{chip.text}</span>
                            </div>
                        ))}
                    </h1>
                    <p style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#4b5563',
                        lineHeight: 1.7, maxWidth: '520px'
                    }}>
                        Upload two versions of any regulatory document.<br />
                        RegLens instantly identifies changes, scores risk, and generates compliance tasks — reviewed by humans before any action is taken.
                    </p>
                </div>

                <div style={{
                    marginTop: '64px', width: '100%', maxWidth: '820px', display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', gap: '16px', width: '100%', alignItems: 'stretch' }}>
                        <div style={{ flex: 1 }}>
                            <DropZone label="REGULATION v1 · BASELINE" file={file1} onDrop={setFile1} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
                            <div style={{ width: '1px', flex: 1, backgroundColor: '#1a1d27' }} />
                            <div style={{
                                backgroundColor: '#080a0f', border: '1px solid #1a1d27', borderRadius: '4px',
                                padding: '4px 8px', margin: '16px 0', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#2d3348'
                            }}>
                                VS
                            </div>
                            <div style={{ width: '1px', flex: 1, backgroundColor: '#1a1d27' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <DropZone label="REGULATION v2 · NEW" file={file2} onDrop={setFile2} />
                        </div>
                    </div>
                    <div style={{ marginTop: '32px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <button
                            className="compare-btn"
                            onClick={handleStart}
                            disabled={!bothFilesLoaded}
                            style={{
                                width: '100%', maxWidth: '300px',
                                padding: '16px 48px',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '13px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                fontWeight: 500,
                                backgroundColor: bothFilesLoaded ? '#0ea5e9' : '#0c0e13',
                                border: bothFilesLoaded ? 'none' : '1px solid #1a1d27',
                                color: bothFilesLoaded ? '#ffffff' : '#2d3348',
                                borderRadius: '6px',
                                cursor: bothFilesLoaded ? 'pointer' : 'not-allowed',
                                transition: 'all 150ms ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: bothFilesLoaded ? '0 4px 16px rgba(14,165,233,0.2)' : 'none',
                            }}
                        >
                            Analyze Documents
                            <span className="compare-btn-icon" style={{ opacity: bothFilesLoaded ? 1 : 0.3 }}>&rarr;</span>
                        </button>
                    </div>
                    <div style={{
                        marginTop: '32px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#2d3348', letterSpacing: '0.05em'
                    }}>
                        <span>🔒 End-to-end isolated sessions</span>
                        <span style={{ color: '#1a1d27' }}>·</span>
                        <span>⚡ Results in under 30 seconds</span>
                        <span style={{ color: '#1a1d27' }}>·</span>
                        <span>👤 Human review required prior to action</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
