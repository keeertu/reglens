import React, { useEffect, useState } from 'react';
import { Check, Clock, AlertTriangle, Loader2 } from 'lucide-react';
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
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center p-12 text-slate-400 bg-slate-800/30 rounded-xl border border-slate-700">
                <p>No actionable tasks at the moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Pending Approvals</h3>
            <div className="grid gap-4">
                {tasks.map((task) => (
                    <div key={task.id} className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full border ${task.priority === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                    }`}>
                                    {task.priority || 'Medium'} Priority
                                </span>
                                <span className="text-xs text-slate-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {task.date || 'Today'}
                                </span>
                            </div>
                            <h4 className="font-medium text-slate-200">{task.description || "Review Document Analysis"}</h4>
                            <p className="text-sm text-slate-400">ID: {task.id}</p>
                        </div>

                        {task.status === 'approved' ? (
                            <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                                <Check className="w-4 h-4" />
                                <span className="text-sm font-medium">Approved</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleApprove(task.id)}
                                disabled={approvingId === task.id}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium"
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
                    </div>
                ))}
            </div>
        </div>
    );
}
