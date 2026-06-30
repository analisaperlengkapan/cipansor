'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function WhatsAppTemplatesPage() {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['wa-templates'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/whatsapp/templates');
      return res.json();
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/whatsapp/templates/sync', {
        method: 'POST'
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wa-templates'] });
      toast.success(data.message || 'Sinkronisasi berhasil');
    }
  });

  if (isLoading) return <div>Memuat...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Template WhatsApp</h1>
        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
          {syncMutation.isPending ? 'Mensinkronkan...' : 'Sinkronisasi dari Meta'}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Template</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Bahasa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Konten</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates?.data?.map((tpl: any) => (
              <TableRow key={tpl.id}>
                <TableCell className="font-medium">{tpl.name}</TableCell>
                <TableCell>{tpl.category}</TableCell>
                <TableCell>{tpl.language}</TableCell>
                <TableCell>
                  <Badge variant={tpl.status === 'APPROVED' ? 'default' : 'secondary'}>
                    {tpl.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md truncate text-xs text-gray-500">
                  {tpl.content}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
