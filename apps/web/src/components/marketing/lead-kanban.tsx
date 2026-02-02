"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import { Lead, useUpdateLead } from "@/hooks/use-leads";
import { LeadStatus } from "@cipansor/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";

const COLUMNS: { id: LeadStatus; title: string; color: string }[] = [
  { id: LeadStatus.NEW, title: "Baru", color: "bg-blue-100 text-blue-800" },
  { id: LeadStatus.CONTACTED, title: "Dihubungi", color: "bg-yellow-100 text-yellow-800" },
  { id: LeadStatus.QUALIFIED, title: "Potensial", color: "bg-purple-100 text-purple-800" },
  { id: LeadStatus.CONVERTED, title: "Dikonversi", color: "bg-green-100 text-green-800" },
  { id: LeadStatus.LOST, title: "Lost", color: "bg-gray-100 text-gray-800" },
];

interface LeadKanbanProps {
  leads: Lead[];
}

export function LeadKanban({ leads }: LeadKanbanProps) {
  const updateMutation = useUpdateLead();
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeLead = useMemo(() => leads.find((l) => l.id === activeId), [
    leads,
    activeId,
  ]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const leadId = active.id as string;
      const newStatus = over.id as LeadStatus;

      const lead = leads.find((l) => l.id === leadId);
      if (lead && lead.status !== newStatus) {
        updateMutation.mutate({ id: leadId, data: { status: newStatus } });
      }
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-200px)] gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            color={col.color}
            leads={leads.filter((l) => l.status === col.id)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  id,
  title,
  leads,
}: {
  id: string;
  title: string;
  color: string;
  leads: Lead[];
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="flex h-full w-[300px] min-w-[300px] flex-col rounded-lg bg-muted/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary">{leads.length}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {leads.map((lead) => (
          <DraggableLeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50"
      >
        <LeadCard lead={lead} />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <LeadCard lead={lead} />
    </div>
  );
}

function LeadCard({ lead, isOverlay }: { lead: Lead; isOverlay?: boolean }) {
  return (
    <Card className={`cursor-grab active:cursor-grabbing bg-card ${isOverlay ? "shadow-xl rotate-2" : "hover:shadow-md transition-shadow"}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-start">
            <Link href={`/marketing/leads/${lead.id}`} className="font-medium hover:underline block truncate pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                {lead.name}
            </Link>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {lead.phone}
        </div>
        {lead.campaign && (
            <Badge variant="outline" className="text-[10px] h-5">
                {lead.campaign.code}
            </Badge>
        )}
        <div className="text-xs text-muted-foreground text-right mt-2">
            {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: idLocale })}
        </div>
      </CardContent>
    </Card>
  );
}
