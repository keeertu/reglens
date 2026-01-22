import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, Loader2, ListTodo } from 'lucide-react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AnalysisPage = () => {
    const { filename } = useParams();
    const navigate = useNavigate();
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generatingTasks, setGeneratingTasks] = useState(false);

    useEffect(() => {
        try {
            const stored = sessionStorage.getItem("analysis_result");

            if (!stored) {
                setError("No analysis found. Upload files again.");
                setLoading(false);
                return;
            }

            const parsed = JSON.parse(stored);

            if (!parsed || !parsed.changes) {
                setError("Analysis data corrupted. Re-upload files.");
                setLoading(false);
                return;
            }

            setAnalysis(parsed);
        } catch (err) {
            setError("Failed to load analysis. Try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleGenerateTasks = async () => {
        if (!analysis?.changes) return;

        setGeneratingTasks(true);
        try {
            await api.generateTasks(analysis.changes);
            navigate('/tasks');
        } catch (e) {
            alert('Failed to generate tasks');
        } finally {
            setGeneratingTasks(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <h2 className="text-xl font-semibold">Analyzing Integrity...</h2>
                <p className="text-muted-foreground">RegLens AI is scanning {filename} for changes.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h2 className="text-red-500 text-xl font-bold mb-4">Error</h2>
                <p>{error}</p>
                <Button onClick={() => navigate('/documents')} className="mt-4">Back</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-5xl animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/documents')}>Documents</span>
                <span>/</span>
                <span className="font-medium text-primary line-clamp-1">{filename}</span>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-blue-500" />
                                        AI Analysis Report
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        RegLens Diff Engine • Confidence: High
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700">AI Generated</Badge>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="bg-muted/30 p-4 rounded-lg text-sm mb-6">
                                "{analysis?.summary || "No summary generated."}"
                            </div>

                            <h3 className="text-lg font-semibold mb-3">Detected Changes</h3>

                            <div className="space-y-4">
                                {analysis?.changes?.length > 0 ? (
                                    analysis.changes.map((change, i) => (
                                        <div key={i} className="border rounded-lg p-4 bg-card shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline">{change.section}</Badge>
                                                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                    {change.type}
                                                </span>
                                            </div>

                                            {change.before && (
                                                <div className="bg-red-50/50 p-2 rounded border border-red-100 mt-2">
                                                    <span className="font-semibold text-red-700 block mb-1">Original Text</span>
                                                    <span className="text-red-900/80">{change.before}</span>
                                                </div>
                                            )}

                                            {change.after && (
                                                <div className="bg-green-50/50 p-2 rounded border border-green-100 mt-2">
                                                    <span className="font-semibold text-green-700 block mb-1">New Text</span>
                                                    <span className="text-green-900/80">{change.after}</span>
                                                </div>
                                            )}

                                            {change.text && (
                                                <div className="bg-muted p-2 rounded border mt-2">
                                                    {change.text}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground">No detected changes.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recommended Actions</CardTitle>
                            <CardDescription>Based on analysis</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Generate compliance tasks from detected changes.
                            </p>

                            <Button onClick={handleGenerateTasks} className="w-full mt-4" disabled={generatingTasks}>
                                {generatingTasks ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <ListTodo className="mr-2 h-4 w-4" />
                                )}
                                Convert to Tasks
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AnalysisPage;
