"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Props {
  task: any;
}

export function TaskCard({ task }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-2">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm leading-tight">
              {task.title}
            </span>
          </div>
          {task.priority !== "MEDIUM" && (
            <Badge
              variant={
                task.priority === "URGENT" || task.priority === "HIGH"
                  ? "destructive"
                  : "outline"
              }
              className="text-[10px] h-5 px-1"
            >
              {task.priority}
            </Badge>
          )}
        </CardContent>
        {(task.assignee || task.dueDate) && (
          <CardFooter className="p-3 pt-0 flex justify-between items-center text-xs text-muted-foreground">
            {task.dueDate && (
              <span>{format(new Date(task.dueDate), "MMM d")}</span>
            )}
            {task.assignee && (
              <Avatar className="w-5 h-5">
                <AvatarImage src={task.assignee.photoUrl} />
                <AvatarFallback className="text-[10px]">
                  {task.assignee?.name?.substring(0, 2).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
