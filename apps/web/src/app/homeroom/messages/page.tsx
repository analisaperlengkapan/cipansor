'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Send,
  Plus,
  Search,
  Mail,
  MessageSquare,
  AlertTriangle,
  Award,
  Bell,
  CalendarDays,
  CheckCircle,
  Clock,
  User,
  Eye,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Types
type MessageType = 'INFO' | 'WARNING' | 'URGENT' | 'ACHIEVEMENT' | 'INVITATION';
type MessageStatus = 'DRAFT' | 'SENT' | 'READ' | 'REPLIED';

interface ParentMessage {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  subject: string;
  message: string;
  type: MessageType;
  status: MessageStatus;
  sentAt?: string;
  readAt?: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

// Demo data
const DEMO_MESSAGES: ParentMessage[] = [
  {
    id: 'msg1',
    studentId: 's3',
    studentName: 'Muhammad Rizki',
    parentName: 'Bapak Ahmad Rizki',
    subject: 'Selamat! Putra Bapak Juara Olimpiade',
    message: 'Assalamualaikum Bapak Ahmad yang dirahmati Allah.\n\nKami ingin mengabarkan kabar baik bahwa putra Bapak, Muhammad Rizki, telah berhasil meraih Juara 1 Olimpiade Matematika Tingkat Kota. Ini adalah prestasi yang sangat membanggakan.\n\nKami mengundang Bapak untuk hadir dalam acara penyerahan penghargaan yang akan dilaksanakan pada hari Senin, 29 Januari 2024.',
    type: 'ACHIEVEMENT',
    status: 'REPLIED',
    sentAt: '2024-01-21T09:00:00',
    readAt: '2024-01-21T12:30:00',
    reply: 'Waalaikumsalam. Terima kasih banyak atas kabarnya, Bu. Alhamdulillah. InsyaAllah saya akan hadir di acara tersebut. Jazakallahu khairan.',
    repliedAt: '2024-01-21T13:00:00',
    createdAt: '2024-01-21T08:30:00',
  },
  {
    id: 'msg2',
    studentId: 's5',
    studentName: 'Dimas Pratama',
    parentName: 'Ibu Siti Pratama',
    subject: 'Perhatian: Keterlambatan Berulang',
    message: 'Assalamualaikum Ibu Siti yang dirahmati Allah.\n\nKami ingin menginformasikan bahwa putra Ibu, Dimas Pratama, tercatat terlambat masuk kelas sebanyak 3 kali dalam minggu ini.\n\nKami berharap dapat berdiskusi dengan Ibu mengenai hal ini untuk menemukan solusi terbaik. Mohon dapat menghubungi kami untuk menjadwalkan pertemuan.',
    type: 'WARNING',
    status: 'READ',
    sentAt: '2024-01-22T10:00:00',
    readAt: '2024-01-22T14:00:00',
    createdAt: '2024-01-22T09:30:00',
  },
  {
    id: 'msg3',
    studentId: 's2',
    studentName: 'Aisyah Putri',
    parentName: 'Bapak Ibrahim',
    subject: 'Informasi: Jadwal Pengambilan Rapor',
    message: 'Assalamualaikum Bapak Ibrahim yang dirahmati Allah.\n\nKami ingin menginformasikan bahwa pengambilan rapor semester ganjil akan dilaksanakan pada:\n\nHari: Sabtu, 27 Januari 2024\nWaktu: 08.00 - 12.00 WIB\nTempat: Ruang kelas masing-masing\n\nMohon kehadiran Bapak/Ibu tepat waktu. Terima kasih.',
    type: 'INFO',
    status: 'SENT',
    sentAt: '2024-01-23T08:00:00',
    createdAt: '2024-01-23T07:30:00',
  },
  {
    id: 'msg4',
    studentId: 's6',
    studentName: 'Nur Hidayah',
    parentName: 'Ibu Aminah',
    subject: 'Undangan: Study Tour ke Museum Nasional',
    message: 'Assalamualaikum Ibu Aminah yang dirahmati Allah.\n\nKami bermaksud mengundang siswa-siswi kelas VII untuk mengikuti kegiatan study tour ke Museum Nasional pada:\n\nHari: Rabu, 31 Januari 2024\nBiaya: Rp 150.000\n\nMohon mengisi formulir persetujuan dan mengirimkan biaya paling lambat tanggal 26 Januari 2024.',
    type: 'INVITATION',
    status: 'DRAFT',
    createdAt: '2024-01-23T09:00:00',
  },
];

const MESSAGE_TYPE_CONFIG: Record<MessageType, { label: string; color: string; icon: React.ReactNode }> = {
  INFO: { label: 'Informasi', color: 'bg-blue-100 text-blue-800', icon: <Bell className="h-4 w-4" /> },
  WARNING: { label: 'Perhatian', color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-4 w-4" /> },
  URGENT: { label: 'Penting', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> },
  ACHIEVEMENT: { label: 'Prestasi', color: 'bg-green-100 text-green-800', icon: <Award className="h-4 w-4" /> },
  INVITATION: { label: 'Undangan', color: 'bg-purple-100 text-purple-800', icon: <CalendarDays className="h-4 w-4" /> },
};

const MESSAGE_STATUS_CONFIG: Record<MessageStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  SENT: { label: 'Terkirim', color: 'bg-blue-100 text-blue-800' },
  READ: { label: 'Dibaca', color: 'bg-green-100 text-green-800' },
  REPLIED: { label: 'Dibalas', color: 'bg-purple-100 text-purple-800' },
};

const STUDENTS = [
  { id: 's1', name: 'Ahmad Fauzan', parentName: 'Bapak Fauzan' },
  { id: 's2', name: 'Aisyah Putri', parentName: 'Bapak Ibrahim' },
  { id: 's3', name: 'Muhammad Rizki', parentName: 'Bapak Ahmad Rizki' },
  { id: 's4', name: 'Zahra Amelia', parentName: 'Ibu Fatimah' },
  { id: 's5', name: 'Dimas Pratama', parentName: 'Ibu Siti Pratama' },
  { id: 's6', name: 'Nur Hidayah', parentName: 'Ibu Aminah' },
  { id: 's7', name: 'Farel Aditya', parentName: 'Bapak Aditya' },
  { id: 's8', name: 'Siti Rahmawati', parentName: 'Ibu Rahmah' },
];

const MESSAGE_TEMPLATES = [
  {
    type: 'INFO' as MessageType,
    subject: 'Informasi: Jadwal Pengambilan Rapor',
    message: 'Assalamualaikum [Nama Wali] yang dirahmati Allah.\n\nKami ingin menginformasikan bahwa pengambilan rapor semester [semester] akan dilaksanakan pada:\n\nHari: [hari]\nWaktu: [waktu]\nTempat: Ruang kelas masing-masing\n\nMohon kehadiran Bapak/Ibu tepat waktu. Terima kasih.',
  },
  {
    type: 'WARNING' as MessageType,
    subject: 'Perhatian: [Masalah]',
    message: 'Assalamualaikum [Nama Wali] yang dirahmati Allah.\n\nKami ingin menginformasikan bahwa putra/putri Bapak/Ibu, [Nama Siswa], [deskripsi masalah].\n\nKami berharap dapat berdiskusi dengan Bapak/Ibu mengenai hal ini untuk menemukan solusi terbaik.',
  },
  {
    type: 'ACHIEVEMENT' as MessageType,
    subject: 'Selamat! [Prestasi]',
    message: 'Assalamualaikum [Nama Wali] yang dirahmati Allah.\n\nKami ingin mengabarkan kabar baik bahwa putra/putri Bapak/Ibu, [Nama Siswa], telah berhasil [prestasi].\n\nIni adalah pencapaian yang sangat membanggakan. Semoga bisa terus berprestasi.',
  },
  {
    type: 'INVITATION' as MessageType,
    subject: 'Undangan: [Nama Acara]',
    message: 'Assalamualaikum [Nama Wali] yang dirahmati Allah.\n\nKami bermaksud mengundang untuk menghadiri acara [nama acara] yang akan dilaksanakan pada:\n\nHari: [hari]\nWaktu: [waktu]\nTempat: [tempat]\n\nMohon konfirmasi kehadiran. Terima kasih.',
  },
];

export default function ParentMessagesPage() {
  const [messages, setMessages] = useState<ParentMessage[]>(DEMO_MESSAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ParentMessage | null>(null);

  // Compose form state
  const [composeForm, setComposeForm] = useState({
    studentIds: [] as string[],
    type: 'INFO' as MessageType,
    subject: '',
    message: '',
    sendToAll: false,
  });

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'sent' && msg.status !== 'DRAFT') ||
      (activeTab === 'draft' && msg.status === 'DRAFT') ||
      (activeTab === 'replied' && msg.status === 'REPLIED');

    return matchesSearch && matchesTab;
  });

  const handleSend = () => {
    if ((!composeForm.studentIds.length && !composeForm.sendToAll) || !composeForm.subject || !composeForm.message) {
      toast.error('Lengkapi semua data yang diperlukan');
      return;
    }

    const studentIds = composeForm.sendToAll 
      ? STUDENTS.map(s => s.id) 
      : composeForm.studentIds;

    studentIds.forEach(studentId => {
      const student = STUDENTS.find(s => s.id === studentId);
      if (!student) return;

      const newMessage: ParentMessage = {
        id: `msg${Date.now()}-${studentId}`,
        studentId,
        studentName: student.name,
        parentName: student.parentName,
        subject: composeForm.subject,
        message: composeForm.message,
        type: composeForm.type,
        status: 'SENT',
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [newMessage, ...prev]);
    });

    setIsComposeOpen(false);
    setComposeForm({
      studentIds: [],
      type: 'INFO',
      subject: '',
      message: '',
      sendToAll: false,
    });
    toast.success(`Pesan berhasil dikirim ke ${studentIds.length} wali murid`);
  };

  const handleUseTemplate = (template: typeof MESSAGE_TEMPLATES[0]) => {
    setComposeForm(prev => ({
      ...prev,
      type: template.type,
      subject: template.subject,
      message: template.message,
    }));
  };

  const toggleStudentSelection = (studentId: string) => {
    setComposeForm(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId],
    }));
  };

  const getSummary = () => ({
    total: messages.length,
    sent: messages.filter(m => m.status === 'SENT').length,
    read: messages.filter(m => m.status === 'READ').length,
    replied: messages.filter(m => m.status === 'REPLIED').length,
    draft: messages.filter(m => m.status === 'DRAFT').length,
  });

  const summary = getSummary();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/homeroom">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Komunikasi Wali Murid</h1>
          <p className="text-muted-foreground">Kelas VII-A - SMP IT Al-Ikhlas</p>
        </div>
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tulis Pesan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Kirim Pesan ke Wali Murid</DialogTitle>
              <DialogDescription>
                Tulis pesan untuk orang tua/wali siswa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Templates */}
              <div className="space-y-2">
                <Label>Template Cepat</Label>
                <div className="flex flex-wrap gap-2">
                  {MESSAGE_TEMPLATES.map((template, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      {MESSAGE_TYPE_CONFIG[template.type].icon}
                      <span className="ml-1">{MESSAGE_TYPE_CONFIG[template.type].label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Penerima</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="sendToAll"
                      checked={composeForm.sendToAll}
                      onCheckedChange={(checked) => setComposeForm(prev => ({ 
                        ...prev, 
                        sendToAll: !!checked,
                        studentIds: checked ? [] : prev.studentIds 
                      }))}
                    />
                    <Label htmlFor="sendToAll" className="text-sm font-normal">
                      Kirim ke semua wali kelas
                    </Label>
                  </div>
                </div>
                {!composeForm.sendToAll && (
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {STUDENTS.map(student => (
                      <div key={student.id} className="flex items-center gap-2">
                        <Checkbox
                          id={student.id}
                          checked={composeForm.studentIds.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <Label htmlFor={student.id} className="flex-1 text-sm font-normal cursor-pointer">
                          {student.name} <span className="text-muted-foreground">({student.parentName})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {composeForm.studentIds.length > 0 && !composeForm.sendToAll && (
                  <p className="text-xs text-muted-foreground">
                    {composeForm.studentIds.length} siswa dipilih
                  </p>
                )}
              </div>

              {/* Message Type */}
              <div className="space-y-2">
                <Label>Jenis Pesan</Label>
                <Select
                  value={composeForm.type}
                  onValueChange={(value) => setComposeForm(prev => ({ ...prev, type: value as MessageType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MESSAGE_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label>Subjek</Label>
                <Input
                  placeholder="Subjek pesan"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Isi Pesan</Label>
                <Textarea
                  placeholder="Tulis pesan..."
                  value={composeForm.message}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                Kirim Pesan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-cyan-100 dark:bg-cyan-900/20">
                <Send className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.sent}</p>
                <p className="text-sm text-muted-foreground">Terkirim</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.read}</p>
                <p className="text-sm text-muted-foreground">Dibaca</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.replied}</p>
                <p className="text-sm text-muted-foreground">Dibalas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-900/20">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.draft}</p>
                <p className="text-sm text-muted-foreground">Draft</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama siswa, wali, atau subjek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua ({messages.length})</TabsTrigger>
          <TabsTrigger value="sent">Terkirim ({messages.filter(m => m.status !== 'DRAFT').length})</TabsTrigger>
          <TabsTrigger value="replied">Dibalas ({messages.filter(m => m.status === 'REPLIED').length})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({messages.filter(m => m.status === 'DRAFT').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Tidak ada pesan ditemukan</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map(message => (
                <Card 
                  key={message.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedMessage(message)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{message.studentName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{message.studentName}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-muted-foreground">{message.parentName}</span>
                          <Badge className={`text-xs ${MESSAGE_TYPE_CONFIG[message.type].color}`}>
                            {MESSAGE_TYPE_CONFIG[message.type].label}
                          </Badge>
                          <Badge className={`text-xs ${MESSAGE_STATUS_CONFIG[message.status].color}`}>
                            {MESSAGE_STATUS_CONFIG[message.status].label}
                          </Badge>
                        </div>
                        <p className="font-medium mt-1">{message.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {message.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          {message.sentAt ? (
                            <span>Dikirim: {new Date(message.sentAt).toLocaleString('id-ID')}</span>
                          ) : (
                            <span>Dibuat: {new Date(message.createdAt).toLocaleString('id-ID')}</span>
                          )}
                          {message.readAt && (
                            <>
                              <span>•</span>
                              <span>Dibaca: {new Date(message.readAt).toLocaleString('id-ID')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={MESSAGE_TYPE_CONFIG[selectedMessage.type].color}>
                    {MESSAGE_TYPE_CONFIG[selectedMessage.type].icon}
                    <span className="ml-1">{MESSAGE_TYPE_CONFIG[selectedMessage.type].label}</span>
                  </Badge>
                  <Badge className={MESSAGE_STATUS_CONFIG[selectedMessage.status].color}>
                    {MESSAGE_STATUS_CONFIG[selectedMessage.status].label}
                  </Badge>
                </div>
                <DialogTitle>{selectedMessage.subject}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{selectedMessage.studentName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{selectedMessage.studentName}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{selectedMessage.parentName}</span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    {selectedMessage.sentAt 
                      ? `Dikirim: ${new Date(selectedMessage.sentAt).toLocaleString('id-ID')}`
                      : `Dibuat: ${new Date(selectedMessage.createdAt).toLocaleString('id-ID')}`
                    }
                  </p>
                </div>

                {selectedMessage.reply && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">Balasan dari {selectedMessage.parentName}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{selectedMessage.reply}</p>
                    <p className="text-xs text-muted-foreground mt-4">
                      {selectedMessage.repliedAt && `Dibalas: ${new Date(selectedMessage.repliedAt).toLocaleString('id-ID')}`}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
