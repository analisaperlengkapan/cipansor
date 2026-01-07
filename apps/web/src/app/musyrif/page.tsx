'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  AlertTriangle,
  Moon,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/shared';

interface MusyrifStudent {
  id: string;
  name: string;
  nis: string;
  photo: string | null;
  class: string;
  room: string;
  gender: string;
}

export default function MusyrifDashboard() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Fetch assigned students
  const { data: students = [], isLoading } = useQuery<MusyrifStudent[]>({
    queryKey: ['musyrif', 'students'],
    queryFn: async () => {
      const res = await api.get('/dormitories/my-students');
      return res.data.data;
    },
  });

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.nis.includes(search) ||
    s.room.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Musyrif Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Assalamu'alaikum, Ustadz
          </p>
        </div>
        <Avatar>
          <AvatarFallback>US</AvatarFallback>
        </Avatar>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto flex-col py-4 gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10"
          onClick={() => router.push('/ibadah/bulk')}
        >
          <Moon className="w-6 h-6 text-primary" />
          <span className="text-xs font-medium">Input Ibadah</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col py-4 gap-2 border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
          onClick={() => router.push('/violations/create')}
        >
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <span className="text-xs font-medium">Lapor Pelanggaran</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col py-4 gap-2 border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
          onClick={() => router.push('/tahfidz/create')}
        >
          <BookOpen className="w-6 h-6 text-green-500" />
          <span className="text-xs font-medium">Setoran Tahfidz</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col py-4 gap-2 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10"
          onClick={() => router.push('/attendance/create')}
        >
          <CheckCircle2 className="w-6 h-6 text-blue-500" />
          <span className="text-xs font-medium">Absen Kamar</span>
        </Button>
      </div>

      {/* Student List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Santri Binaan ({filteredStudents.length})
          </h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIS, atau kamar..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada santri ditemukan
              </div>
            ) : (
              filteredStudents.map((student) => (
                <Card key={student.id} className="overflow-hidden" onClick={() => router.push(`/student/${student.id}`)}>
                  <div className="p-3 flex items-center gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={student.photo || undefined} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium truncate">{student.name}</p>
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {student.room}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {student.nis} • Kelas {student.class}
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted/50 p-2 flex justify-end gap-2">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/ibadah/create?studentId=${student.id}`);
                    }}>
                      <Moon className="w-3 h-3 mr-1" /> Ibadah
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700" onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/violations/create?studentId=${student.id}`);
                    }}>
                      <AlertTriangle className="w-3 h-3 mr-1" /> Pelanggaran
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Summary Stats (Placeholder for now) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ringkasan Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted rounded">
              <p className="text-xs text-muted-foreground">Hadir</p>
              <p className="font-bold">-</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-xs text-muted-foreground">Sakit</p>
              <p className="font-bold">-</p>
            </div>
            <div className="p-2 bg-muted rounded">
              <p className="text-xs text-muted-foreground">Izin</p>
              <p className="font-bold">-</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
