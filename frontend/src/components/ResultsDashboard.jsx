import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CHANGES = [
    {
        id: 1, section: '§ 4.2 Data Retention', type: 'MODIFIED', severity: 'HIGH',
        old: 'Data must be retained for 5 years...', new: 'Data must be retained for 7 years...'
    },
    {
        id: 2, section: '§ 6.1 Breach Notification', type: 'MODIFIED', severity: 'CRITICAL',
        old: 'Notify within 72 hours of discovery.', new: 'Notify within 24 hours of discovery.'
    },
    {
        id: 3, section: '§ 8.3 Third Party Audits', type: 'ADDED', severity: 'MED',
        old: '', new: 'Annual third-party security audits are now mandatory for all Tier 1 processors.'
    },
    {
        id: 4, section: '§ 2.7 Consent Requirements', type: 'REMOVED', severity: 'LOW',
        old: 'Implied consent is acceptable for analytics cookies.', new: ''
    },
    {
        id: 5, section: '§ 11.0 Penalty Structure', type: 'MODIFIED', severity: 'CRITICAL',
        old: 'Maximum fine: €10M or 2% global turnover.', new: 'Maximum fine: €20M or 4% global turnover.'
    },
];

const AUDIT_LOG = [
    { id: 1, action: 'Document Uploaded', user: 'System', time: '1:24:02 AM', status: 'success' },
    { id: 2, action: 'Text Extraction', user: 'AI Engine', time: '1:24:08 AM', status: 'success' },
    { id: 3, action: 'Section Alignment', user: 'AI Engine', time: '1:24:12 AM', status: 'success' },
    { id: 4, action: 'Change Detection', user: 'LLM-v4', time: '1:24:25 AM', status: 'success' },
    { id: 5, action: 'Risk Scoring', user: 'LLM-v4', time: '1:24:28 AM', status: 'success' },
];

function CountUp({ target, duration = 1500 }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let startTime = null;
        let animationFrame;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = currentTime - startTime;
            const t = Math.min(progress / duration, 1);
            const easeT = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            setCount(Math.floor(easeT * target));
            if (t < 1) animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [target, duration]);
    return <span>{count}</span>;
}

const TYPE_STYLES = {
    MODIFIED: { bg: '#1a1500', color: '#f59e0b', border: '#2d2200' },
    ADDED: { bg: '#001a0d', color: '#22c55e', border: '#003318' },
    REMOVED: { bg: '#1a0505', color: '#ef4444', border: '#330a0a' }
};

const SEV_STYLES = {
    CRITICAL: { bg: '#1a0000', color: '#f87171', border: '#3d0000' },
    HIGH: { bg: '#1a0d00', color: '#fb923c', border: '#3d1f00' },
    MED: { bg: '#111a00', color: '#a3e635', border: '#243d00' },
    LOW: { bg: '#001020', color: '#60a5fa', border: '#002040' }
};

export default function ResultsDashboard() {
    const [activeTab, setActiveTab] = useState('queue');
    const [selectedId, setSelectedId] = useState(CHANGES[0].id);
    const [statusMap, setStatusMap] = useState({});
    const [shakingId, setShakingId] = useState(null);
    const [ripplingAction, setRipplingAction] = useState(null);

    const selectedChange = CHANGES.find(c => c.id === selectedId);
    const dynamicallyApproved = Object.values(statusMap).filter(v => v === 'approved').length;
    const dynamicallyRejected = Object.values(statusMap).filter(v => v === 'rejected').length;
    const statsApproved = dynamicallyApproved;
    const statsPending = Math.max(0, 8 - dynamicallyApproved - dynamicallyRejected);

    const handleApprove = () => {
        setRipplingAction('approve');
        setTimeout(() => {
            setStatusMap(prev => ({ ...prev, [selectedId]: 'approved' }));
            setRipplingAction(null);
        }, 400);
    };

    const handleReject = () => {
        setShakingId(selectedId);
        setTimeout(() => {
            setStatusMap(prev => ({ ...prev, [selectedId]: 'rejected' }));
            setShakingId(null);
        }, 400);
    };

    const handleFlag = () => {
        setStatusMap(prev => ({ ...prev, [selectedId]: 'flagged' }));
    };

    const renderText = (text, type) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, i) => {
            if (!line.trim()) return null;
            const isBefore = type === 'before';
            const bg = isBefore ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)';
            const color = isBefore ? '#fca5a5' : '#86efac';
            const bColor = isBefore ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)';
            return (
                <span key={i} style={{
                    display: 'block', backgroundColor: bg, color: color, padding: '4px 8px', borderLeft: `2px solid ${bColor}`,
                    marginBottom: '2px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', lineHeight: '1.8'
                }}>
                    {line}
                </span>
            );
        });
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'transparent' }}>
            {/* Sidebar */}
            <div style={{ width: '220px', minWidth: '220px', height: '100%', borderRight: '1px solid var(--border)', backgroundColor: 'var(--bg-deep)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                <div style={{ height: '80px', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: 'var(--accent)' }}>RL</span>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>RegLens</span>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'queue', label: 'Review Queue' },
                        { id: 'audit', label: 'Audit Log' },
                        { id: 'export', label: 'Export' }
                    ].map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <div key={item.id} onClick={() => setActiveTab(item.id)} style={{
                                padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: '13px',
                                fontWeight: isActive ? 600 : 500, color: isActive ? '#fff' : '#4b5563', backgroundColor: isActive ? 'rgba(14,165,233,0.08)' : 'transparent',
                                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.15s ease'
                            }}
                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#9ca3af'; }}
                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#4b5563'; }}
                            >
                                {item.label}
                            </div>
                        );
                    })}
                </nav>

                <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>
                        Session #A3F2<br />
                        {new Date().toISOString().slice(0, 10)} {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Stats Row */}
                <div style={{ padding: '24px 32px 0 32px', display: 'flex', gap: '16px' }}>
                    {[
                        { label: 'CHANGES DETECTED', val: 47, color: 'var(--accent)' },
                        { label: 'HIGH RISK', val: 12, color: 'var(--danger)' },
                        { label: 'PENDING REVIEW', val: statsPending, color: 'var(--warning)' },
                        { label: 'APPROVED', val: statsApproved, color: 'var(--success)' }
                    ].map((stat, i) => (
                        <div key={i} style={{
                            flex: 1, backgroundColor: '#0f1117', border: '1px solid #1e2230', borderRadius: '6px', padding: '16px',
                            position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', cursor: 'default'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2d3348'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1e2230'}
                        >
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: stat.color }} />
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#4b5563', marginBottom: '8px' }}>
                                {stat.label}
                            </div>
                            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 700, color: '#fff' }}>
                                <CountUp target={stat.val} />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', marginTop: '24px' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'queue' && (
                            <motion.div key="queue" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ display: 'flex', flex: 1, width: '100%' }}>
                                {/* Left Panel - Queue */}
                                <div style={{ width: '38%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', padding: '0 16px 16px 32px' }}>
                                    <div style={{ marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        REVIEW QUEUE
                                        <span style={{ backgroundColor: 'var(--surface2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>{CHANGES.length}</span>
                                    </div>
                                    <div style={{ height: '1px', backgroundColor: '#1a1d27', width: '100%', marginBottom: '16px' }} />
                                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }} className="custom-scroll">
                                        {CHANGES.map(change => {
                                            const isSelected = selectedId === change.id;
                                            const status = statusMap[change.id];
                                            const isShaking = shakingId === change.id;
                                            const typeStyle = TYPE_STYLES[change.type];
                                            const sevStyle = SEV_STYLES[change.severity];
                                            return (
                                                <div key={change.id} onClick={() => setSelectedId(change.id)} style={{
                                                    padding: '14px 16px', backgroundColor: isSelected ? '#0f1219' : '#0c0e13', border: '1px solid',
                                                    borderColor: isSelected ? 'var(--border)' : '#191b24', borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: '6px',
                                                    cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', opacity: status ? 0.4 : 1, animation: isShaking ? 'shake 0.4s ease' : 'none', position: 'relative'
                                                }}
                                                    onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translateX(2px)'; e.currentTarget.style.borderColor = '#2a2d3a'; } }}
                                                    onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#191b24'; } }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff' }}>{change.section}</div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {status === 'approved' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />}
                                                            {status === 'rejected' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--danger)' }} />}
                                                            {status === 'flagged' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--warning)', animation: 'pulseGlow 2s infinite' }} />}
                                                            {!status && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(245,158,11,0.5)', animation: 'pulseGlow 2s infinite' }} />}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '3px', backgroundColor: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }}>{change.type}</span>
                                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '3px', backgroundColor: sevStyle.bg, color: sevStyle.color, border: `1px solid ${sevStyle.border}` }}>{change.severity} RISK</span>
                                                    </div>
                                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#4b5563', marginTop: '8px', lineHeight: '1.4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{change.new ? change.new : change.old}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingRight: '32px' }}>
                                    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                        <AnimatePresence mode="wait">
                                            <motion.div key={selectedId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex', flex: 1, gap: '24px', paddingLeft: '16px' }}>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#ef4444', marginBottom: '12px' }}>BEFORE</div>
                                                    <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 320px)', backgroundColor: '#0f0a0a', border: '1px solid #2d1515', borderRadius: '6px', padding: '20px' }}>
                                                        {selectedChange?.old ? renderText(selectedChange.old, 'before') : (<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ border: '1px dashed #2d1515', padding: '16px 32px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>—— no previous text ——</div></div>)}
                                                    </div>
                                                </div>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#22c55e', marginBottom: '12px' }}>AFTER</div>
                                                    <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 320px)', backgroundColor: '#080f0a', border: '1px solid #152d1e', borderRadius: '6px', padding: '20px' }}>
                                                        {selectedChange?.new ? renderText(selectedChange.new, 'after') : (<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ border: '1px dashed #152d1e', padding: '16px 32px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>—— no new text ——</div></div>)}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </AnimatePresence>
                                        <div style={{ padding: '16px 0 16px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#2d3348', display: 'flex', gap: '8px' }}>
                                            <span>§ {selectedChange?.section}</span><span>·</span><span>{selectedChange?.type}</span><span>·</span><span>{selectedChange?.severity}</span>
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: '#080a0f', borderTop: '1px solid #1a1d27', padding: '16px', marginLeft: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
                                        <button onClick={handleFlag} disabled={!!statusMap[selectedId]} style={{ fontFamily: 'inherit', fontSize: '11px', letterSpacing: '0.08em', padding: '8px 20px', borderRadius: '4px', cursor: statusMap[selectedId] ? 'default' : 'pointer', transition: 'all 0.15s ease', backgroundColor: 'transparent', border: '1px solid #2d2200', color: '#f59e0b', opacity: statusMap[selectedId] ? 0.3 : 1 }} onMouseEnter={(e) => { if (!statusMap[selectedId]) e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.08)' }} onMouseLeave={(e) => { if (!statusMap[selectedId]) e.currentTarget.style.backgroundColor = 'transparent' }}>FLAG</button>
                                        <button onClick={handleReject} disabled={!!statusMap[selectedId]} style={{ fontFamily: 'inherit', fontSize: '11px', letterSpacing: '0.08em', padding: '8px 20px', borderRadius: '4px', cursor: statusMap[selectedId] ? 'default' : 'pointer', transition: 'all 0.15s ease', backgroundColor: 'transparent', border: '1px solid #330a0a', color: '#ef4444', opacity: statusMap[selectedId] ? 0.3 : 1 }} onMouseEnter={(e) => { if (!statusMap[selectedId]) e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)' }} onMouseLeave={(e) => { if (!statusMap[selectedId]) e.currentTarget.style.backgroundColor = 'transparent' }}>REJECT</button>
                                        <button onClick={handleApprove} disabled={!!statusMap[selectedId]} style={{ fontFamily: 'inherit', fontSize: '11px', letterSpacing: '0.08em', padding: '8px 20px', borderRadius: '4px', cursor: statusMap[selectedId] ? 'default' : 'pointer', transition: 'all 0.15s ease', backgroundColor: '#052010', border: '1px solid #22c55e', color: '#22c55e', opacity: statusMap[selectedId] ? 0.3 : 1, position: 'relative', overflow: 'hidden' }} onMouseEnter={(e) => { if (!statusMap[selectedId]) e.currentTarget.style.backgroundColor = 'rgba(34,197,94,0.12)' }} onMouseLeave={(e) => { if (!statusMap[selectedId]) e.currentTarget.style.backgroundColor = '#052010' }}>APPROVE{ripplingAction === 'approve' && (<div style={{ position: 'absolute', top: '50%', left: '50%', width: '100px', height: '100px', backgroundColor: '#fff', borderRadius: '50%', transform: 'translate(-50%, -50%)', animation: 'ripple 0.6s linear forwards', pointerEvents: 'none' }} />)}</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
                                <div style={{ fontSize: '24px', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '24px' }}>Analysis Overview</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                                    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
                                        <div style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', marginBottom: '16px' }}>RISK DISTRIBUTION</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {[
                                                { label: 'Critical', val: 24, color: 'var(--danger)' },
                                                { label: 'High', val: 36, color: 'var(--warning)' },
                                                { label: 'Medium', val: 20, color: 'var(--accent)' },
                                                { label: 'Low', val: 20, color: 'var(--success)' },
                                            ].map(item => (
                                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '60px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>{item.label}</div>
                                                    <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${item.val}%`, backgroundColor: item.color, borderRadius: '3px' }} />
                                                    </div>
                                                    <div style={{ width: '30px', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }}>{item.val}%</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
                                        <div style={{ fontSize: '14px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)', marginBottom: '16px' }}>MATCH ACCURACY</div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
                                            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg width="100" height="100" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent)" strokeWidth="8" strokeDasharray="212 70" strokeLinecap="round" transform="rotate(-90 50 50)" />
                                                </svg>
                                                <div style={{ position: 'absolute', fontSize: '20px', fontWeight: 700 }}>98%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'audit' && (
                            <motion.div key="audit" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
                                <div style={{ fontSize: '24px', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '24px' }}>Platform Audit Log</div>
                                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                                                <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>TIMESTAMP</th>
                                                <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>ACTION</th>
                                                <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>ACTOR</th>
                                                <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {AUDIT_LOG.map(log => (
                                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{log.time}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{log.action}</td>
                                                    <td style={{ padding: '12px 16px' }}>{log.user}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{ color: 'var(--success)', backgroundColor: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{log.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'export' && (
                            <motion.div key="export" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ padding: '64px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontSize: '32px', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '16px' }}>Export Results</div>
                                <div style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', marginBottom: '40px', textAlign: 'center' }}>Configure your compliance report export format and delivery.</div>
                                <div style={{ display: 'flex', gap: '24px' }}>
                                    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', width: '240px', textAlign: 'center', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📄</div>
                                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Executive Summary</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PDF • High-level breakdown</div>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', width: '240px', textAlign: 'center', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
                                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Detailed Audit Trail</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JSON/CSV • Raw change data</div>
                                    </div>
                                </div>
                                <button style={{ marginTop: '48px', backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '14px 40px', borderRadius: '6px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer' }}>GENERATE & DOWNLOAD</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
