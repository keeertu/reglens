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
        } catch {
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
        } catch {
            alert('Failed to generate tasks');
        } finally {
            setGeneratingTasks(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <h2 className="text-xl font-semibold">Analyzing...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h2 className="text-red-500 text-xl font-bold mb-4">Error</h2>
                <p>{error}</p>
                <Button onClick={() => navigate('/')} className="mt-4">Back</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-5xl">
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-blue-500" />
                        AI Analysis Report
                    </CardTitle>
                    <CardDescription>RegLens Diff Engine</CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="bg-muted/30 p-4 rounded mb-6">
                        {analysis.summary || "No summary generated."}
                    </div>

                    <h3 className="text-lg font-semibold mb-3">Detected Changes</h3>

                    <div className="space-y-4">
                        {analysis.changes.length > 0 ? (
                            analysis.changes.map((change, i) => (
                                <div key={i} className="border rounded-lg p-4 bg-card shadow-sm">

                                    <div className="flex justify-between mb-2">
                                        <Badge variant="outline">{change.section}</Badge>
                                        <span className="text-xs bg-amber-50 px-2 py-1 rounded">
                                            {change.type}
                                        </span>
                                    </div>

                                    {change.before && (
                                        <div className="bg-red-50 p-2 rounded mt-2">
                                            <strong>Original</strong>
                                            <p>{change.before}</p>
                                        </div>
                                    )}

                                    {change.after && (
                                        <div className="bg-green-50 p-2 rounded mt-2">
                                            <strong>New</strong>
                                            <p>{change.after}</p>
                                        </div>
                                    )}

                                    {change.text && (
                                        <div className="bg-muted p-2 rounded mt-2">
                                            {change.text}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground">No changes detected.</p>
                        )}
                    </div>

                    <Button 
                        onClick={handleGenerateTasks} 
                        className="w-full mt-6" 
                        disabled={generatingTasks}
                    >
                        {generatingTasks ? <Loader2 className="mr-2 animate-spin" /> : <ListTodo className="mr-2" />}
                        Convert to Tasks
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
};

export default AnalysisPage;
