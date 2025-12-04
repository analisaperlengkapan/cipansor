'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  Calendar,
  User,
  BookOpen,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageCircle,
  Star,
  ThumbsUp,
  RefreshCw,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// ========================================
// TYPES
// ========================================

interface Child {
  id: string;
  student: {
    id: string;
    nis: string;
    name: string;
    class?: {
      name: string;
      teacher?: {
        name: string;
      };
    };
  };
}

interface CommunicationEntry {
  id: string;
  date: string;
  type: 'FROM_TEACHER' | 'FROM_PARENT' | 'SYSTEM';
  category: 'ACADEMIC' | 'BEHAVIOR' | 'HEALTH' | 'GENERAL' | 'ATTENDANCE' | 'TAHFIDZ';
  subject: string;
  message: string;
  senderName: string;
  senderRole: string;
  isRead: boolean;
  isImportant: boolean;
  hasReply: boolean;
  replies?: Reply[];
}

interface Reply {
  id: string;
  message: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
}

interface WeeklyProgress {
  week: string;
  attendance: {
    present: number;
    absent: number;
    sick: number;
    permitted: number;
  };
  tahfidz: {
    newMemorization: number;
    review: number;
    grade: string;
  };
  behavior: {
    positive: number;
    negative: number;
    notes: string;
  };
  academic: {
    averageScore: number;
    improvement: string;
  };
}

// ========================================
// MOCK DATA (would come from API)
// ========================================

const MOCK_ENTRIES: CommunicationEntry[] = [
  {
    id: '1',
    date: new Date().toISOString(),
    type: 'FROM_TEACHER',
    category: 'TAHFIDZ',
    subject: 'Progress Hafalan Juz 30',
    message:
      'Assalamualaikum Bapak/Ibu, Ananda menunjukkan progress yang sangat baik dalam hafalan Juz 30. Minggu ini berhasil menambah hafalan Surah Al-Buruj dan Al-Insyiqaq dengan tajwid yang baik. Mohon bantuannya untuk muraja\'ah di rumah.',
    senderName: 'Ust. Ahmad',
    senderRole: 'Musyrif Tahfidz',
    isRead: false,
    isImportant: true,
    hasReply: false,
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000).toISOString(),
    type: 'FROM_TEACHER',
    category: 'ACADEMIC',
    subject: 'Hasil Ulangan Matematika',
    message:
      'Ananda mendapat nilai 85 pada ulangan matematika kemarin. Perlu ditingkatkan lagi dalam materi pecahan. Mohon dampingi latihan di rumah.',
    senderName: 'Ibu Sri',
    senderRole: 'Wali Kelas',
    isRead: true,
    isImportant: false,
    hasReply: true,
    replies: [
      {
        id: 'r1',
        message:
          'Terima kasih informasinya Bu. Akan kami dampingi latihan di rumah. Apakah ada buku latihan yang direkomendasikan?',
        senderName: 'Orang Tua',
        senderRole: 'Parent',
        createdAt: new Date(Date.now() - 82800000).toISOString(),
      },
      {
        id: 'r2',
        message:
          'Bisa menggunakan buku latihan MATEMATIKA AKTIF halaman 45-60. Terima kasih kerjasamanya.',
        senderName: 'Ibu Sri',
        senderRole: 'Wali Kelas',
        createdAt: new Date(Date.now() - 79200000).toISOString(),
      },
    ],
  },
  {
    id: '3',
    date: new Date(Date.now() - 172800000).toISOString(),
    type: 'SYSTEM',
    category: 'ATTENDANCE',
    subject: 'Notifikasi Keterlambatan',
    message: 'Ananda tercatat terlambat hadir pada tanggal ini (08:15 WIB). Mohon perhatian untuk jadwal keberangkatan.',
    senderName: 'Sistem',
    senderRole: 'Auto',
    isRead: true,
    isImportant: false,
    hasReply: false,
  },
  {
    id: '4',
    date: new Date(Date.now() - 259200000).toISOString(),
    type: 'FROM_TEACHER',
    category: 'BEHAVIOR',
    subject: 'Apresiasi Sikap Positif',
    message:
      'Ananda menunjukkan sikap kepemimpinan yang baik dengan membantu teman-temannya dalam kegiatan kebersihan kelas. Terima kasih atas didikan di rumah.',
    senderName: 'Ibu Sri',
    senderRole: 'Wali Kelas',
    isRead: true,
    isImportant: false,
    hasReply: true,
    replies: [
      {
        id: 'r3',
        message: 'Alhamdulillah, terima kasih Bu atas informasinya. Senang mendengar ananda bisa membantu.',
        senderName: 'Orang Tua',
        senderRole: 'Parent',
        createdAt: new Date(Date.now() - 255600000).toISOString(),
      },
    ],
  },
];

const MOCK_WEEKLY_PROGRESS: WeeklyProgress = {
  week: 'Minggu ke-3 November 2024',
  attendance: { present: 5, absent: 0, sick: 0, permitted: 0 },
  tahfidz: {
    newMemorization: 15,
    review: 30,
    grade: 'Jayyid Jiddan',
  },
  behavior: {
    positive: 3,
    negative: 0,
    notes: 'Aktif dalam kegiatan kelas dan membantu teman',
  },
  academic: {
    averageScore: 85.5,
    improvement: 'Naik 2.5 poin dari minggu sebelumnya',
  },
};

// ========================================
// COMPONENT
// ========================================

export default function BukuPenghubungPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [entries, setEntries] = useState<CommunicationEntry[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState({ subject: '', message: '', category: 'GENERAL' });
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch children
        const childrenRes = await api.get('/parent/children');
        const childrenData = childrenRes.data.data || [];
        setChildren(childrenData);

        if (childrenData.length > 0 && !selectedChildId) {
          setSelectedChildId(childrenData[0].student.id);
        }
      } catch (err) {
        console.error('Failed to fetch children:', err);
        toast.error('Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      // In real app, fetch communication entries for selected child
      // For now, use mock data
      setEntries(MOCK_ENTRIES);
      setWeeklyProgress(MOCK_WEEKLY_PROGRESS);
    }
  }, [selectedChildId]);

  const selectedChild = children.find((c) => c.student.id === selectedChildId);

  const filteredEntries = entries.filter((entry) => {
    const matchCategory = filterCategory === 'all' || entry.category === filterCategory;
    const matchSearch =
      !searchQuery ||
      entry.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const unreadCount = entries.filter((e) => !e.isRead).length;

  const handleSendMessage = async () => {
    if (!newMessage.subject || !newMessage.message) {
      toast.error('Lengkapi semua field');
      return;
    }

    try {
      // In real app, send to API
      const newEntry: CommunicationEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: 'FROM_PARENT',
        category: newMessage.category as CommunicationEntry['category'],
        subject: newMessage.subject,
        message: newMessage.message,
        senderName: 'Orang Tua',
        senderRole: 'Parent',
        isRead: true,
        isImportant: false,
        hasReply: false,
      };

      setEntries((prev) => [newEntry, ...prev]);
      setNewMessageOpen(false);
      setNewMessage({ subject: '', message: '', category: 'GENERAL' });
      toast.success('Pesan berhasil dikirim');
    } catch (err) {
      toast.error('Gagal mengirim pesan');
    }
  };

  const handleSendReply = async (entryId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Tulis balasan terlebih dahulu');
      return;
    }

    try {
      const newReply: Reply = {
        id: Date.now().toString(),
        message: replyMessage,
        senderName: 'Orang Tua',
        senderRole: 'Parent',
        createdAt: new Date().toISOString(),
      };

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                hasReply: true,
                replies: [...(entry.replies || []), newReply],
              }
            : entry
        )
      );

      setReplyOpen(null);
      setReplyMessage('');
      toast.success('Balasan berhasil dikirim');
    } catch (err) {
      toast.error('Gagal mengirim balasan');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ACADEMIC: 'bg-blue-100 text-blue-700',
      BEHAVIOR: 'bg-purple-100 text-purple-700',
      HEALTH: 'bg-red-100 text-red-700',
      GENERAL: 'bg-gray-100 text-gray-700',
      ATTENDANCE: 'bg-orange-100 text-orange-700',
      TAHFIDZ: 'bg-green-100 text-green-700',
    };
    return colors[category] || colors.GENERAL;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      ACADEMIC: 'Akademik',
      BEHAVIOR: 'Perilaku',
      HEALTH: 'Kesehatan',
      GENERAL: 'Umum',
      ATTENDANCE: 'Kehadiran',
      TAHFIDZ: 'Tahfidz',
    };
    return labels[category] || 'Umum';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Belum ada data anak</h3>
          <p className="text-muted-foreground mt-2">
            Silakan hubungi admin sekolah untuk menghubungkan akun Anda dengan data anak.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Buku Penghubung Digital
          </h1>
          <p className="text-muted-foreground">
            Komunikasi antara sekolah dan orang tua
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Child Selector */}
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih anak" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.student.id} value={child.student.id}>
                  {child.student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* New Message Button */}
          <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Kirim Pesan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kirim Pesan ke Guru</DialogTitle>
                <DialogDescription>
                  Kirim pesan kepada wali kelas atau guru {selectedChild?.student.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select
                    value={newMessage.category}
                    onValueChange={(value) =>
                      setNewMessage((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">Umum</SelectItem>
                      <SelectItem value="ACADEMIC">Akademik</SelectItem>
                      <SelectItem value="BEHAVIOR">Perilaku</SelectItem>
                      <SelectItem value="HEALTH">Kesehatan</SelectItem>
                      <SelectItem value="ATTENDANCE">Kehadiran</SelectItem>
                      <SelectItem value="TAHFIDZ">Tahfidz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subjek</Label>
                  <Input
                    placeholder="Judul pesan"
                    value={newMessage.subject}
                    onChange={(e) =>
                      setNewMessage((prev) => ({ ...prev, subject: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pesan</Label>
                  <Textarea
                    placeholder="Tulis pesan Anda..."
                    rows={4}
                    value={newMessage.message}
                    onChange={(e) =>
                      setNewMessage((prev) => ({ ...prev, message: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewMessageOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Child Info Card */}
      {selectedChild && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {selectedChild.student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{selectedChild.student.name}</h3>
                <p className="text-sm text-muted-foreground">
                  NIS: {selectedChild.student.nis} • Kelas:{' '}
                  {selectedChild.student.class?.name || '-'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Wali Kelas: {selectedChild.student.class?.teacher?.name || '-'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {unreadCount} pesan belum dibaca
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Pesan ({entries.length})
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-2">
            <Calendar className="h-4 w-4" />
            Progress Mingguan
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari pesan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="ACADEMIC">Akademik</SelectItem>
                    <SelectItem value="BEHAVIOR">Perilaku</SelectItem>
                    <SelectItem value="HEALTH">Kesehatan</SelectItem>
                    <SelectItem value="ATTENDANCE">Kehadiran</SelectItem>
                    <SelectItem value="TAHFIDZ">Tahfidz</SelectItem>
                    <SelectItem value="GENERAL">Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Tidak ada pesan</p>
                </CardContent>
              </Card>
            ) : (
              filteredEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className={`${!entry.isRead ? 'border-primary/50 bg-primary/5' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          className={`${
                            entry.type === 'FROM_TEACHER'
                              ? 'bg-blue-100 text-blue-700'
                              : entry.type === 'SYSTEM'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {entry.type === 'SYSTEM'
                            ? '🔔'
                            : entry.senderName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{entry.senderName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {entry.senderRole}
                          </Badge>
                          <Badge className={`text-xs ${getCategoryColor(entry.category)}`}>
                            {getCategoryLabel(entry.category)}
                          </Badge>
                          {entry.isImportant && (
                            <Badge variant="destructive" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Penting
                            </Badge>
                          )}
                          {!entry.isRead && (
                            <Badge className="text-xs bg-primary">Baru</Badge>
                          )}
                        </div>
                        <h4 className="font-medium mt-1">{entry.subject}</h4>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {entry.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(entry.date), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </span>
                          {entry.hasReply && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Sudah dibalas
                            </span>
                          )}
                        </div>

                        {/* Replies */}
                        {entry.replies && entry.replies.length > 0 && (
                          <div className="mt-4 pl-4 border-l-2 border-muted space-y-3">
                            {entry.replies.map((reply) => (
                              <div key={reply.id} className="text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{reply.senderName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {reply.senderRole}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(reply.createdAt), {
                                      addSuffix: true,
                                      locale: idLocale,
                                    })}
                                  </span>
                                </div>
                                <p className="text-muted-foreground mt-1">
                                  {reply.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Button */}
                        {entry.type !== 'SYSTEM' && (
                          <div className="mt-3">
                            {replyOpen === entry.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Tulis balasan..."
                                  rows={2}
                                  value={replyMessage}
                                  onChange={(e) => setReplyMessage(e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSendReply(entry.id)}>
                                    <Send className="h-3 w-3 mr-1" />
                                    Kirim
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReplyOpen(null);
                                      setReplyMessage('');
                                    }}
                                  >
                                    Batal
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReplyOpen(entry.id)}
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Balas
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Weekly Progress Tab */}
        <TabsContent value="weekly" className="space-y-4">
          {weeklyProgress && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {weeklyProgress.week}
                  </CardTitle>
                  <CardDescription>
                    Ringkasan perkembangan {selectedChild?.student.name} minggu ini
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Attendance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Kehadiran
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">
                          {weeklyProgress.attendance.present}
                        </p>
                        <p className="text-xs text-green-600">Hadir</p>
                      </div>
                      <div className="p-2 bg-red-100 rounded-lg">
                        <p className="text-2xl font-bold text-red-700">
                          {weeklyProgress.attendance.absent}
                        </p>
                        <p className="text-xs text-red-600">Alpha</p>
                      </div>
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-700">
                          {weeklyProgress.attendance.sick}
                        </p>
                        <p className="text-xs text-yellow-600">Sakit</p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">
                          {weeklyProgress.attendance.permitted}
                        </p>
                        <p className="text-xs text-blue-600">Izin</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tahfidz */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Tahfidz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Hafalan Baru</span>
                        <span className="font-medium">
                          {weeklyProgress.tahfidz.newMemorization} ayat
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Muraja'ah</span>
                        <span className="font-medium">
                          {weeklyProgress.tahfidz.review} ayat
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Predikat</span>
                        <Badge className="bg-green-100 text-green-700">
                          {weeklyProgress.tahfidz.grade}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Behavior */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      Perilaku
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                            +{weeklyProgress.behavior.positive}
                          </span>
                          <span className="text-sm">Positif</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
                            -{weeklyProgress.behavior.negative}
                          </span>
                          <span className="text-sm">Negatif</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {weeklyProgress.behavior.notes}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Akademik
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Nilai Rata-rata</span>
                        <span className="text-2xl font-bold text-primary">
                          {weeklyProgress.academic.averageScore}
                        </span>
                      </div>
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        {weeklyProgress.academic.improvement}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
