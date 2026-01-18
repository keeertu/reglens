import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, ShieldAlert, FileDown,
    Loader2, Play, AlertTriangle, ArrowLeftRight
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const TaskReview = ({ analysis }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.getTasks();
            if (res.tasks) {
                const validTasks = res.tasks.filter(t => t.status);
                setTasks(validTasks);
            }
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        }
    };

    const handleGenerate = async () => {
        if (!analysis || !analysis.changes) return;
        setLoading(true);
        try {
            await api.generateTasks(analysis.changes);
            await fetchTasks();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (task) => {
        try {
            await api.approveTask(task.id);
            await fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleReject = async (task) => {
        try {
            await api.rejectTask(task.id);
            await fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await api.exportTasksPdf("RegLens Compliance Sign-off");
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "Compliance_Report.pdf";

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF export failed", err);
            alert("Failed to download PDF");
        }
    };

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const approvedTasks = tasks.filter(t => t.status === 'approved');

    if (tasks.length === 0 && (!analysis || !analysis.changes)) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                <AlertTriangle className="h-12 w-12 opacity-50" />
                <p>No analysis data available. Please upload a document first.</p>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Compliance Task Generation</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        RegLens will analyze {analysis?.changes?.length || 0} changes
                        to identify mandatory compliance actions.
                    </p>
                </div>

                <Button size="lg" onClick={handleGenerate} disabled={loading} className="gap-2 h-12 px-8 text-lg shadow-lg hover:shadow-xl transition-all">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                    Start Generation
                </Button>
            </div>
        );
    }

    if (pendingTasks.length > 0) {
        const currentTask = pendingTasks[0];
        return (
            <div className="max-w-2xl mx-auto py-8 space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">Review Tasks</h2>
                        <p className="text-muted-foreground">Approve or reject generated compliance actions.</p>
                    </div>
                    <Badge variant="outline" className="h-8 px-4 text-sm font-medium">
                        {pendingTasks.length} Remaining
                    </Badge>
                </div>

                <Card className="border-2 shadow-2xl overflow-hidden rounded-2xl border-primary/10">
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-2">
                                <CardTitle className="text-2xl font-bold leading-tight text-primary">
                                    {currentTask.title}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
                                        Source: {currentTask.source_clause}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge className={`${currentTask.risk_level === 'High'
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : currentTask.risk_level === 'Medium'
                                        ? 'bg-orange-500 hover:bg-orange-600'
                                        : 'bg-emerald-500 hover:bg-emerald-600'
                                    } text-white px-3 py-1`}>
                                    {currentTask.risk_level || 'Medium'} Risk
                                </Badge>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                    <ArrowLeftRight className="h-3 w-3" />
                                    {currentTask.change_type}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-0">
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-semibold uppercase text-slate-400 mb-3 tracking-widest">Action Required</h4>
                            <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed italic">
                                "{currentTask.description}"
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-4 justify-between p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t">
                        <Button
                            variant="outline"
                            onClick={() => handleReject(currentTask)}
                            className="flex-1 h-12 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
                        >
                            <XCircle className="h-5 w-5" />
                            Discard
                        </Button>
                        <Button
                            onClick={() => handleApprove(currentTask)}
                            className="flex-[2] h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
                        >
                            <CheckCircle2 className="h-5 w-5" />
                            Approve Action
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-6">
                <div className="relative inline-flex">
                    <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative inline-flex items-center justify-center p-6 rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-4xl font-extrabold tracking-tight">Review Complete</h2>
                    <p className="text-xl text-muted-foreground">
                        You've finalized <span className="text-foreground font-bold">{approvedTasks.length}</span> compliance tasks.
                    </p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button size="lg" onClick={handleExport} className="h-14 px-8 text-lg gap-3 bg-primary shadow-xl hover:scale-105 transition-transform">
                        <FileDown className="h-6 w-6" />
                        Download PDF Report
                    </Button>
                </div>
            </div>

            {approvedTasks.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border"></div>
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Audit Trail: Approved Items</h3>
                        <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div className="grid gap-3">
                        {approvedTasks.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-5 border rounded-2xl bg-card hover:border-primary/20 transition-all group">
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{t.title}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                            {t.source_clause}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                            {t.risk_level} Risk
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="hidden group-hover:block text-xs font-medium text-emerald-600 animate-in fade-in slide-in-from-right-2">
                                        Ready for Audit
                                    </div>
                                    <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <ShieldAlert className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskReview;
