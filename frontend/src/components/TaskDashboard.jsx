import React from 'react';
import { CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

export const TaskDashboard = ({ analysis }) => {
    if (!analysis) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                Run an analysis to generate compliance tasks.
            </div>
        );
    }

    const tasks = analysis.tasks || [];

    if (tasks.length === 0) {
        return (
            <div className="text-center py-20 bg-muted/20 rounded-lg">
                No tasks generated from this regulation update.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {tasks.map((task) => (
                <Card key={task.id}>
                    <CardContent className="p-6 flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge>{task.priority}</Badge>
                                <span className="text-xs text-muted-foreground">
                                    {task.id}
                                </span>
                            </div>

                            <h3 className="font-semibold text-lg">
                                {task.title}
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                {task.description}
                            </p>

                            <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="h-4 w-4" />
                                    {task.owner}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {task.change_type}
                                </span>
                            </div>
                        </div>

                        <div className="text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-5 w-5" />
                            Pending
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
