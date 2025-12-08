'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Trash2, 
  BookOpen,
  Calendar,
  GripVertical,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Common subjects for SD IT
const SUBJECTS = [
  { value: 'matematika', label: 'Matematika' },
  { value: 'bahasa_indonesia', label: 'Bahasa Indonesia' },
  { value: 'bahasa_inggris', label: 'Bahasa Inggris' },
  { value: 'bahasa_arab', label: 'Bahasa Arab' },
  { value: 'ipa', label: 'IPA' },
  { value: 'ips', label: 'IPS' },
  { value: 'pkn', label: 'PKn' },
  { value: 'pai', label: 'Pendidikan Agama Islam' },
  { value: 'tahfidz', label: 'Tahfidz' },
  { value: 'aqidah', label: 'Aqidah Akhlaq' },
  { value: 'fiqih', label: 'Fiqih' },
  { value: 'sbdp', label: 'SBdP' },
  { value: 'pjok', label: 'PJOK' },
  { value: 'informatika', label: 'Informatika' },
  { value: 'lainnya', label: 'Lainnya' },
];

export interface HomeworkItem {
  id: string;
  subject: string;
  description: string;
  dueDate?: string;
  isCompleted?: boolean;
  notes?: string;
}

interface HomeworkListProps {
  items: HomeworkItem[];
  onChange: (items: HomeworkItem[]) => void;
  readOnly?: boolean;
  showCompletion?: boolean;
  className?: string;
}

export function HomeworkList({
  items,
  onChange,
  readOnly = false,
  showCompletion = false,
  className,
}: HomeworkListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addHomework = () => {
    const newItem: HomeworkItem = {
      id: crypto.randomUUID(),
      subject: '',
      description: '',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      isCompleted: false,
    };
    onChange([...items, newItem]);
    setExpandedId(newItem.id);
  };

  const updateHomework = (id: string, updates: Partial<HomeworkItem>) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const removeHomework = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const toggleCompletion = (id: string) => {
    updateHomework(id, { 
      isCompleted: !items.find(i => i.id === id)?.isCompleted 
    });
  };

  const getSubjectLabel = (value: string) => {
    return SUBJECTS.find(s => s.value === value)?.label || value;
  };

  const getDueDateStatus = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Terlambat', variant: 'destructive' as const };
    if (diffDays === 0) return { label: 'Hari ini', variant: 'warning' as const };
    if (diffDays === 1) return { label: 'Besok', variant: 'secondary' as const };
    return { label: `${diffDays} hari lagi`, variant: 'outline' as const };
  };

  if (readOnly && items.length === 0) {
    return (
      <div className={cn("text-center py-6 text-muted-foreground", className)}>
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Tidak ada PR hari ini</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Pekerjaan Rumah (PR)
          {items.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {items.length}
            </Badge>
          )}
        </Label>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addHomework}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Tambah PR
          </Button>
        )}
      </div>

      {/* Homework Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <Card 
            key={item.id} 
            className={cn(
              "transition-all",
              item.isCompleted && "opacity-60 bg-muted/50"
            )}
          >
            <CardContent className="p-3">
              {readOnly ? (
                // Read-only view
                <div className="flex items-start gap-3">
                  {showCompletion && (
                    <Checkbox
                      checked={item.isCompleted}
                      onCheckedChange={() => toggleCompletion(item.id)}
                      className="mt-1"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        {getSubjectLabel(item.subject)}
                      </Badge>
                      {item.dueDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.dueDate).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                      {getDueDateStatus(item.dueDate) && !item.isCompleted && (
                        <Badge variant={getDueDateStatus(item.dueDate)?.variant}>
                          {getDueDateStatus(item.dueDate)?.label}
                        </Badge>
                      )}
                      {item.isCompleted && (
                        <Badge variant="success" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Selesai
                        </Badge>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm mt-1",
                      item.isCompleted && "line-through"
                    )}>
                      {item.description}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Catatan: {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // Edit view
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHomework(item.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Mata Pelajaran</Label>
                      <Select
                        value={item.subject}
                        onValueChange={(value) => updateHomework(item.id, { subject: value })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Pilih mapel" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Batas Waktu</Label>
                      <Input
                        type="date"
                        value={item.dueDate || ''}
                        onChange={(e) => updateHomework(item.id, { dueDate: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Deskripsi Tugas</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateHomework(item.id, { description: e.target.value })}
                      placeholder="Contoh: Kerjakan halaman 25 nomor 1-10"
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state for edit mode */}
      {!readOnly && items.length === 0 && (
        <div 
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={addHomework}
        >
          <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Klik untuk menambahkan PR
          </p>
        </div>
      )}

      {/* Summary for read-only */}
      {readOnly && showCompletion && items.length > 0 && (
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground">Progress PR:</span>
          <span className="font-medium">
            {items.filter(i => i.isCompleted).length} / {items.length} selesai
          </span>
        </div>
      )}
    </div>
  );
}

export default HomeworkList;
