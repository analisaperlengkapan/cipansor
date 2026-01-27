'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  column: any;
  onAddTask: () => void;
}

export function ProjectColumn({ column, onAddTask }: Props) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col w-80 bg-muted/50 rounded-lg h-full max-h-full">
      <div className="p-3 font-medium flex items-center justify-between border-b bg-card rounded-t-lg">
        <div className="flex items-center gap-2">
          <span>{column.name}</span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {column.tasks.length}
          </Badge>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 p-2 overflow-y-auto min-h-[150px] space-y-2">
        <SortableContext
          items={column.tasks.map((t: any) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task: any) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>

      <div className="p-2 border-t bg-card rounded-b-lg">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={onAddTask}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
