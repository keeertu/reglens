import React from "react";
import { CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TasksPage = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="container mx-auto py-20 text-center text-muted-foreground">
        No analysis run yet.
      </div>
    );
  }

  if (!analysis.tasks || analysis.tasks.length === 0) {
    return (
      <div className="container mx-auto py-20 text-center text-muted-foreground">
        No tasks generated.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-5xl animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Compliance Tasks
        </h1>
        <p className="text-muted-foreground">
          Actionable engineering tasks generated from regulatory changes.
        </p>
      </div>

      <div className="grid gap-4">
        {analysis.tasks.map((task) => (
          <Card key={task.id} className="bg-card">
            <CardContent className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{task.title}</h3>
                <Badge
                  className={
                    task.priority === "high"
                      ? "bg-red-600"
                      : task.priority === "medium"
                      ? "bg-yellow-600"
                      : "bg-muted"
                  }
                >
                  {task.priority || "normal"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {task.description}
              </p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  {task.owner || "Unassigned"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {task.change_type}
                </span>
              </div>

              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Ready for implementation
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TasksPage;
