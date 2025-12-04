'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Search, Calendar, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  author?: {
    name: string;
  };
  unit?: {
    name: string;
  };
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulated data - replace with actual API call
    const mockAnnouncements: Announcement[] = [
      {
        id: '1',
        title: 'Pengumuman Libur Hari Raya Idul Fitri 1446 H',
        content: 'Diberitahukan kepada seluruh santri dan orang tua wali bahwa libur Hari Raya Idul Fitri akan dimulai tanggal 28 Maret 2025. Santri dapat dijemput mulai tanggal 27 Maret 2025 setelah sholat Ashar.',
        priority: 'HIGH',
        createdAt: new Date().toISOString(),
        author: { name: 'Admin Pesantren' },
        unit: { name: 'Pesantren Al-Hikmah' },
      },
      {
        id: '2',
        title: 'Jadwal Ujian Tengah Semester Genap 2024/2025',
        content: 'Ujian Tengah Semester Genap akan dilaksanakan pada tanggal 10-15 Februari 2025. Materi yang diujikan meliputi seluruh materi yang telah dipelajari sejak awal semester genap.',
        priority: 'MEDIUM',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        author: { name: 'Bidang Kurikulum' },
        unit: { name: 'Pesantren Al-Hikmah' },
      },
      {
        id: '3',
        title: 'Kegiatan Rutin Tahfidz Mingguan',
        content: 'Mengingatkan kembali bahwa kegiatan setoran hafalan rutin dilaksanakan setiap hari Senin-Kamis pukul 05.30-06.30 WIB dan 16.00-17.00 WIB. Diharapkan seluruh santri hadir tepat waktu.',
        priority: 'LOW',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        author: { name: 'Koordinator Tahfidz' },
        unit: { name: 'Pesantren Al-Hikmah' },
      },
      {
        id: '4',
        title: 'PENTING: Pembayaran SPP Bulan Februari',
        content: 'Diinformasikan kepada orang tua wali agar segera melakukan pembayaran SPP bulan Februari 2025 paling lambat tanggal 10 Februari 2025. Pembayaran dapat dilakukan melalui transfer bank atau langsung ke bagian keuangan.',
        priority: 'URGENT',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        author: { name: 'Bagian Keuangan' },
        unit: { name: 'Pesantren Al-Hikmah' },
      },
    ];

    setTimeout(() => {
      setAnnouncements(mockAnnouncements);
      setLoading(false);
    }, 500);
  }, []);

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">Mendesak</Badge>;
      case 'HIGH':
        return <Badge variant="destructive" className="bg-orange-500">Penting</Badge>;
      case 'MEDIUM':
        return <Badge variant="secondary">Sedang</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'HIGH':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'MEDIUM':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Pengumuman
          </h1>
          <p className="text-muted-foreground">
            Informasi dan pengumuman terbaru
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari pengumuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Tidak ada pengumuman</h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery
                  ? 'Tidak ada pengumuman yang sesuai dengan pencarian Anda'
                  : 'Belum ada pengumuman yang tersedia'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(announcement.priority)}
                    <div>
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(announcement.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        {announcement.author && (
                          <span>• {announcement.author.name}</span>
                        )}
                        {announcement.unit && (
                          <span>• {announcement.unit.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {getPriorityBadge(announcement.priority)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
