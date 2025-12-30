import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TasksPage = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks/mock');
            // Sort by status pending first
            const sorted = (res.data.tasks || []).sort((a, b) =>
                a.status === 'Pending' ? -1 : 1
            );
            setTasks(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const approveTask = async (taskId) => {
        setProcessingId(taskId);
        try {
            const demoUser = "Judge"; // Hardcoded for demo speed
            await api.post(`/tasks/${taskId}/approve`, {
                approved_by: demoUser
            });
            // Optimistic update or refetch
            await fetchTasks();
        } catch (error) {
            alert("Failed to approve task");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-5xl animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Compliance Tasks</h1>
                <p className="text-muted-foreground">Review and approve actions generated from regulatory updates.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-lg">
                    <p>No tasks pending.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tasks.map((task) => (
                        <Card key={task.task_id} className={`transition-all ${task.status === 'Approved' ? 'bg-muted/40 border-green-100' : 'bg-card'}`}>
                            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={task.status === 'Approved' ? 'default' : 'outline'} className={task.status === 'Approved' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                            {task.status}
                                        </Badge>
                                        <span className="text-xs font-mono text-muted-foreground">{task.task_id}</span>
                                    </div>
                                    <h3 className={`font-semibold text-lg ${task.status === 'Approved' ? 'text-muted-foreground line-through' : ''}`}>
                                        {task.description}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3" /> {task.team}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {task.priority || 'Normal'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    {task.status === 'Pending' ? (
                                        <Button
                                            onClick={() => approveTask(task.task_id)}
                                            disabled={processingId === task.task_id}
                                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                        >
                                            {processingId === task.task_id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                            )}
                                            Approve
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col items-end text-sm text-green-700">
                                            <span className="font-semibold flex items-center gap-1">
                                                <CheckCircle2 className="h-4 w-4" /> Approved
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                by {task.approved_by || 'Unknown'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TasksPage;
