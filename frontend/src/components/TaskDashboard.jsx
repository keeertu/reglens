import React, { useEffect, useState } from 'react';
import { Check, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

export function TaskDashboard({ onError }) {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [approvingId, setApprovingId] = useState(null);

    const fetchTasks = async () => {
        setIsLoading(true);
        const { data, error } = await api.getTasks();
        setIsLoading(false);

        if (error) {
            onError(error);
        } else if (data) {
            // Assume data is array or { tasks: [] }
            const tasksList = Array.isArray(data) ? data : (data.tasks || []);
            setTasks(tasksList);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleApprove = async (taskId) => {
        setApprovingId(taskId);
        const { error } = await api.approveTask(taskId);
        setApprovingId(null);

        if (error) {
            onError(error);
        } else {
            // Optimistically update or refetch
            // Let's refetch to be safe with state
            fetchTasks();
        }
    };

    if (isLoading && tasks.length === 0) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center p-12 text-muted-foreground bg-muted/30 rounded-xl border border-border">
                <p>No actionable tasks at the moment.</p>
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            className="space-y-4"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <h3 className="text-xl font-semibold text-foreground mb-4">Pending Approvals</h3>
            <div className="grid gap-4">
                {tasks.map((task) => (
                    <motion.div
                        key={task.id}
                        variants={item}
                        className="p-5 bg-card border border-border rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full border ${task.priority === 'High' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
                                    'bg-primary/10 border-primary/20 text-primary'
                                    }`}>
                                    {task.priority || 'Medium'} Priority
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {task.date || 'Today'}
                                </span>
                            </div>
                            <h4 className="font-medium text-foreground">{task.description || "Review Document Analysis"}</h4>
                            <p className="text-sm text-muted-foreground">ID: {task.id}</p>
                        </div>

                        {task.status === 'approved' ? (
                            <div className="flex items-center space-x-2 text-green-500 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                                <Check className="w-4 h-4" />
                                <span className="text-sm font-medium">Approved</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleApprove(task.id)}
                                disabled={approvingId === task.id}
                                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                            >
                                {approvingId === task.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Approve</span>
                                    </>
                                )}
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
