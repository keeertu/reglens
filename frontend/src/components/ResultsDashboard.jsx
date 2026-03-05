import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

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

export default function ResultsDashboard({ data, onRestart }) {
    const [activeTab, setActiveTab] = useState('queue');
    const [tasks, setTasks] = useState(data?.tasks || []);
    const [selectedId, setSelectedId] = useState(data?.tasks?.[0]?.id || null);
    const [auditLog, setAuditLog] = useState([
        { id: 'initial-1', action: 'Analysis Complete', time: new Date().toLocaleTimeString(), status: 'success' }
    ]);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (!selectedId && tasks.length > 0) {
            setSelectedId(tasks[0].id);
        }
    }, [tasks, selectedId]);

    const selectedTask = tasks.find(t => t.id === selectedId);

    const statsApproved = tasks.filter(t => t.status === 'approved').length;
    const statsPending = tasks.filter(t => t.status === 'pending').length;
    const statsTotalChanges = data?.changes?.length || 0;

    const addAuditLog = (action) => {
        setAuditLog(prev => [{
            id: Date.now(),
            action,
            time: new Date().toLocaleTimeString(),
            status: 'success'
        }, ...prev]);
    };

    const handleApprove = async () => {
        if (!selectedId) return;
        try {
            await axios.post(`${API_BASE}/tasks/${selectedId}/approve`);
            addAuditLog(`Approved: ${selectedTask.title}`);
            setTasks(prev => prev.map(t => t.id === selectedId ? { ...t, status: 'approved' } : t));
        } catch (err) {
            console.error("Approval failed:", err);
        }
    };

    const handleReject = async () => {
        if (!selectedId) return;
        try {
            await axios.post(`${API_BASE}/tasks/${selectedId}/reject`);
            addAuditLog(`Rejected: ${selectedTask.title}`);
            setTasks(prev => prev.filter(t => t.id !== selectedId));
        } catch (err) {
            console.error("Rejection failed:", err);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await axios.get(`${API_BASE}/tasks/export`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'RegLens_Compliance_Report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            addAuditLog("Exported Compliance PDF");
        } catch (err) {
            console.error("Export failed:", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'transparent' }}>
            <div style={{ width: '220px', minWidth: '220px', height: '100%', borderRight: '1px solid var(--border)', backgroundColor: 'var(--bg-deep)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                <div onClick={onRestart} style={{ height: '80px', display: 'flex', alignItems: 'center', padding: '0 24px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', color: 'var(--accent)' }}>RL</span>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '14px', color: '#fff' }}>RegLens</span>
                    </div>
                </div>
                <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[{ id: 'overview', label: 'Overview' }, { id: 'queue', label: 'Review Queue' }, { id: 'audit', label: 'Audit Log' }, { id: 'export', label: 'Export' }].map(item => (
                        <div key={item.id} onClick={() => setActiveTab(item.id)} style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: '13px', fontWeight: activeTab === item.id ? 600 : 500, color: activeTab === item.id ? '#fff' : '#4b5563', backgroundColor: activeTab === item.id ? 'rgba(14,165,233,0.08)' : 'transparent', borderLeft: activeTab === item.id ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.15s ease' }}>
                            {item.label}
                        </div>
                    ))}
                </nav>
                <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>Session #A3F2<br />{new Date().toLocaleDateString()}</div>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px 0 32px', display: 'flex', gap: '16px' }}>
                    {[
                        { label: 'CHANGES DETECTED', val: statsTotalChanges, color: 'var(--accent)' },
                        { label: 'UNRESOLVED', val: statsPending, color: 'var(--warning)' },
                        { label: 'APPROVED', val: statsApproved, color: 'var(--success)' },
                        { label: 'CONFIDENCE', val: 98, color: 'var(--accent)' }
                    ].map((stat, i) => (
                        <div key={i} style={{ flex: 1, backgroundColor: '#0f1117', border: '1px solid #1e2230', borderRadius: '6px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', backgroundColor: stat.color }} />
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#4b5563', marginBottom: '8px' }}>{stat.label}</div>
                            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 700, color: '#fff' }}><CountUp target={stat.val} />{stat.label === 'CONFIDENCE' && '%'}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', marginTop: '24px' }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'queue' && (
                            <motion.div key="queue" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ display: 'flex', flex: 1, width: '100%' }}>
                                <div style={{ width: '38%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', padding: '0 16px 16px 32px' }}>
                                    <div style={{ marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        REVIEW QUEUE <span style={{ backgroundColor: 'var(--surface2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>{tasks.filter(t => t.status === 'pending').length}</span>
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }} className="custom-scroll">
                                        {tasks.length === 0 ? (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                                                No tasks found.
                                            </div>
                                        ) : (
                                            tasks.map(task => (
                                                <div key={task.id} onClick={() => setSelectedId(task.id)} style={{ padding: '16px', backgroundColor: selectedId === task.id ? '#0f1219' : '#0c0e13', border: '1px solid', borderColor: selectedId === task.id ? 'var(--border)' : '#191b24', borderLeft: selectedId === task.id ? '2px solid var(--accent)' : '2px solid transparent', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px', opacity: task.status !== 'pending' ? 0.4 : 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff' }}>{task.source_clause || 'Clause Unknown'}</div>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: task.status === 'approved' ? 'var(--success)' : 'var(--warning)' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 6px', borderRadius: '3px', backgroundColor: TYPE_STYLES[task.change_type]?.bg || '#1a1500', color: TYPE_STYLES[task.change_type]?.color || '#f59e0b' }}>{task.change_type}</span>
                                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 6px', borderRadius: '3px', backgroundColor: SEV_STYLES[task.risk_level]?.bg || '#1a0d00', color: SEV_STYLES[task.risk_level]?.color || '#fb923c' }}>{task.risk_level} RISK</span>
                                                    </div>
                                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#4b5563', lineHeight: '1.4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingRight: '32px' }}>
                                    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', paddingLeft: '32px' }}>
                                        {selectedTask ? (
                                            <>
                                                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>{selectedTask.title}</div>
                                                <div style={{ backgroundColor: '#0f1219', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
                                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px' }}>RECOMMENDED ACTION</div>
                                                    <div style={{ color: '#fff', lineHeight: '1.6', fontSize: '14px' }}>{selectedTask.description}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#ef4444', marginBottom: '8px' }}>BEFORE</div>
                                                        <div style={{ backgroundColor: '#0f0a0a', border: '1px solid #2d1515', borderRadius: '6px', padding: '16px', fontSize: '12px', color: '#fca5a5', lineHeight: '1.6', fontFamily: "'JetBrains Mono', monospace" }}>{selectedTask.diff_context?.old || '—'}</div>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#22c55e', marginBottom: '8px' }}>AFTER</div>
                                                        <div style={{ backgroundColor: '#080f0a', border: '1px solid #152d1e', borderRadius: '6px', padding: '16px', fontSize: '12px', color: '#86efac', lineHeight: '1.6', fontFamily: "'JetBrains Mono', monospace" }}>{selectedTask.diff_context?.new || '—'}</div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Select a task to review</div>
                                        )}
                                    </div>
                                    <div style={{ padding: '24px 0 24px 32px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                        <button onClick={handleReject} style={{ backgroundColor: 'transparent', border: '1px solid #330a0a', color: '#ef4444', padding: '8px 24px', borderRadius: '4px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>REJECT</button>
                                        <button onClick={handleApprove} style={{ backgroundColor: '#052010', border: '1px solid #22c55e', color: '#22c55e', padding: '8px 24px', borderRadius: '4px', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>APPROVE</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ padding: '32px', flex: 1 }}>
                                <div style={{ fontSize: '24px', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '32px' }}>AI Analysis Summary</div>
                                <div style={{ backgroundColor: '#0f1219', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', marginBottom: '32px', color: '#fff', fontSize: '16px', lineHeight: '1.8' }}>
                                    {data?.summary || 'No summary available.'}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                                    <div style={{ backgroundColor: '#0f1219', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px' }}>
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>RISK DISTRIBUTION</div>
                                        <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                                            {['CRITICAL', 'HIGH', 'MED', 'LOW'].map(lvl => {
                                                const count = tasks.filter(t => t.risk_level === lvl).length;
                                                const height = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                                                return (
                                                    <div key={lvl} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '100%', backgroundColor: SEV_STYLES[lvl].color, height: `${height + 4}px`, borderRadius: '4px', transition: 'height 1s ease' }} />
                                                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{lvl}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'audit' && (
                            <motion.div key="audit" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
                                <div style={{ fontSize: '24px', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: '24px' }}>Session Audit Trail</div>
                                <div style={{ backgroundColor: '#0f1219', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', textAlign: 'left' }}>
                                        <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                                            <tr>
                                                <th style={{ padding: '16px' }}>TIMESTAMP</th>
                                                <th style={{ padding: '16px' }}>ACTION PERFORMED</th>
                                                <th style={{ padding: '16px' }}>STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditLog.map(log => (
                                                <tr key={log.id} style={{ borderTop: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{log.time}</td>
                                                    <td style={{ padding: '16px', color: '#fff' }}>{log.action}</td>
                                                    <td style={{ padding: '16px' }}><span style={{ color: 'var(--success)' }}>{log.status.toUpperCase()}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'export' && (
                            <motion.div key="export" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px' }}>
                                <div style={{ fontSize: '64px', marginBottom: '24px' }}>�</div>
                                <div style={{ fontSize: '24px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Generate Compliance Audit</div>
                                <div style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', maxWidth: '440px', marginBottom: '40px', lineHeight: '1.6' }}>
                                    Export your reviewed and approved regulatory changes into a professional PDF audit report for final sign-off.
                                </div>
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    style={{
                                        backgroundColor: 'var(--accent)', color: '#fff', border: 'none', padding: '16px 48px',
                                        borderRadius: '6px', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                                        cursor: isExporting ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                                        boxShadow: '0 0 20px rgba(14,165,233,0.2)'
                                    }}
                                >
                                    {isExporting ? 'GENERATING...' : 'DOWNLOAD AUDIT PDF'}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
            `}} />
        </div>
    );
}
