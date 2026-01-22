import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, ShieldAlert, FileDown,
    Loader2, Play, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Badge } from './ui/badge';

export const TaskDashboard = ({ analysis }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (analysis) {
            fetchTasks();
        } else {
            setTasks([]);
        }
    }, [analysis]);

    const fetchTasks = async () => {
        try {
            const res = await api.getTasks();
            if (res.tasks) {
                // Ignore legacy mock tasks
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
            const blob = await api.exportTasksPdf();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "Compliance_Report.pdf";
            a.click();
        } catch (e) {
            console.error(e);
        }
    };

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const approvedTasks = tasks.filter(t => t.status === 'approved');

    // prompt for analysis if state is empty
    if (tasks.length === 0 && (!analysis || !analysis.changes)) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                <AlertTriangle className="h-12 w-12 opacity-50" />
                <p>No analysis data available. Please upload a document first.</p>
            </div>
        );
    }

    if (tasks.length === 0) {
        // No COMPLIANCE tasks in backend, but we have analysis
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Compliance Task Generation</h2>
                    <p className="text-muted-foreground max-w-md">
                        RegLens can analyze the {analysis?.changes?.length || 0} detected changes
                        and generate actionable compliance tasks for your team.
                    </p>
                </div>

                <Button size="lg" onClick={handleGenerate} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                    Generate Tasks
                </Button>
            </div>
        );
    }

    if (pendingTasks.length > 0) {
        const currentTask = pendingTasks[0];

        return (
            <div className="max-w-2xl mx-auto py-8 space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Task Review</h2>
                    <Badge variant="outline">{pendingTasks.length} Pending</Badge>
                </div>

                <Card className="border-2 border-primary/20 shadow-lg" key={currentTask.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-xl leading-tight">{currentTask.title}</CardTitle>
                                <CardDescription className="text-sm font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded inline-block mt-1">
                                    Source: {currentTask.source_clause}
                                </CardDescription>
                            </div>
                            <Badge className={currentTask.risk_level === 'High' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}>
                                {currentTask.risk_level || 'Medium'} Risk
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed border border-border/50">
                            {currentTask.description}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ShieldAlert className="h-4 w-4" />
                            Change Type: <span className="font-medium text-foreground capitalize">{currentTask.change_type}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-4 justify-end pt-6 border-t bg-muted/5">
                        <Button variant="destructive" onClick={() => handleReject(currentTask)} className="gap-2 w-32">
                            <XCircle className="h-4 w-4" />
                            Reject
                        </Button>
                        <Button onClick={() => handleApprove(currentTask)} className="gap-2 w-32 bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 text-green-700 mb-4 shadow-sm">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold">Review Complete</h2>
                <p className="text-muted-foreground">
                    You have approved {approvedTasks.length} tasks. No pending items.
                </p>
                <Button size="lg" variant="outline" onClick={handleExport} className="gap-2 mt-2">
                    <FileDown className="h-5 w-5" />
                    Download PDF Report
                </Button>
            </div>

            {approvedTasks.length > 0 && (
                <div className="grid gap-4 mt-12 opacity-90">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Approved Tasks Log</h3>
                    {approvedTasks.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/10 transition-colors">
                            <div>
                                <p className="font-medium">{t.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">Source: {t.source_clause}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">{t.risk_level} Risk</Badge>
                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
