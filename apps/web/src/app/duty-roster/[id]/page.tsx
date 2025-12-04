'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  MapPin,
  Users,
  Star,
  LogIn,
  LogOut,
  AlertTriangle,
  MessageSquare,
  Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DUTY_TYPE_LABELS, DutyType, DutyStatus, DUTY_STATUS_LABELS } from '@/hooks/use-duty-roster';

// Extended status for UI display (includes additional states used in demo)
type UIStatus = DutyStatus | 'SCHEDULED' | 'IN_PROGRESS' | 'MISSED' | 'EXCUSED';

interface StudentAssignment {
  id: string;
  studentId: string;
  student: {
    id: string;
    nis: string;
    name: string;
    class: { id: string; name: string };
  };
  status: UIStatus;
  checkInTime?: string;
  checkOutTime?: string;
  rating?: number;
  points?: number;
  feedback?: string;
}

interface DemoRoster {
  id: string;
  date: string;
  dayOfWeek: number;
  dutyType: DutyType;
  location: string;
  shift: 'MORNING' | 'AFTERNOON' | 'EVENING';
  startTime: string;
  endTime: string;
  students: StudentAssignment[];
  supervisor?: { id: string; name: string };
  notes?: string;
  unit?: { id: string; name: string };
}

// Demo data
const DEMO_ROSTER: DemoRoster = {
  id: 'dr-1',
  date: '2024-01-24',
  dayOfWeek: 3,
  dutyType: 'CLEANING_MOSQUE',
  location: 'Masjid Al-Ikhlas',
  shift: 'MORNING',
  startTime: '05:00',
  endTime: '06:30',
  students: [
    { 
      id: 'da-1', 
      studentId: 's1', 
      student: { id: 's1', nis: '2024001', name: 'Ahmad Fauzan', class: { id: 'c1', name: 'VII-A' } }, 
      status: 'COMPLETED', 
      checkInTime: '05:05', 
      checkOutTime: '06:25', 
      rating: 5, 
      points: 10,
      feedback: 'Sangat rajin dan teliti dalam membersihkan'
    },
    { 
      id: 'da-2', 
      studentId: 's2', 
      student: { id: 's2', nis: '2024002', name: 'Muhammad Rizki', class: { id: 'c1', name: 'VII-A' } }, 
      status: 'COMPLETED', 
      checkInTime: '05:10', 
      checkOutTime: '06:30', 
      rating: 4, 
      points: 8,
      feedback: 'Baik dalam melaksanakan tugas'
    },
    { 
      id: 'da-3', 
      studentId: 's3', 
      student: { id: 's3', nis: '2024003', name: 'Dimas Pratama', class: { id: 'c1', name: 'VII-A' } }, 
      status: 'IN_PROGRESS', 
      checkInTime: '05:15' 
    },
    { 
      id: 'da-4', 
      studentId: 's4', 
      student: { id: 's4', nis: '2024004', name: 'Farel Aditya', class: { id: 'c1', name: 'VII-A' } }, 
      status: 'PENDING'
    },
  ],
  supervisor: { id: 'u1', name: 'Ustadz Ahmad' },
  notes: 'Pastikan semua sudut masjid dibersihkan dengan baik termasuk area wudhu.',
  unit: { id: 'unit-1', name: 'SMP IT Al-Ikhlas' },
};

const STATUS_CONFIG: Record<UIStatus, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  PENDING: { label: 'Menunggu', color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50', icon: <Clock className="h-4 w-4" /> },
  SCHEDULED: { label: 'Terjadwal', color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50', icon: <Clock className="h-4 w-4" /> },
  IN_PROGRESS: { label: 'Berlangsung', color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-50', icon: <Clock className="h-4 w-4" /> },
  COMPLETED: { label: 'Selesai', color: 'bg-green-100 text-green-800', bgColor: 'bg-green-50', icon: <CheckCircle className="h-4 w-4" /> },
  ABSENT: { label: 'Tidak Hadir', color: 'bg-red-100 text-red-800', bgColor: 'bg-red-50', icon: <AlertTriangle className="h-4 w-4" /> },
  MISSED: { label: 'Tidak Hadir', color: 'bg-red-100 text-red-800', bgColor: 'bg-red-50', icon: <AlertTriangle className="h-4 w-4" /> },
  SUBSTITUTED: { label: 'Digantikan', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50', icon: <AlertTriangle className="h-4 w-4" /> },
  EXCUSED: { label: 'Izin', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50', icon: <AlertTriangle className="h-4 w-4" /> },
};

const SHIFT_CONFIG = {
  MORNING: { label: 'Pagi', color: 'bg-amber-100 text-amber-800' },
  AFTERNOON: { label: 'Siang', color: 'bg-orange-100 text-orange-800' },
  EVENING: { label: 'Sore/Malam', color: 'bg-purple-100 text-purple-800' },
};

export default function DutyRosterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rosterId = params.id;

  const [roster, setRoster] = useState<DemoRoster>(DEMO_ROSTER);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    rating: 5,
    feedback: '',
    points: 10,
  });

  const handleCheckIn = (assignmentId: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setRoster(prev => ({
      ...prev,
      students: prev.students.map(s => 
        s.id === assignmentId 
          ? { ...s, status: 'IN_PROGRESS' as UIStatus, checkInTime: time }
          : s
      )
    }));
    toast.success('Check-in berhasil');
  };

  const handleCheckOut = (assignmentId: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setRoster(prev => ({
      ...prev,
      students: prev.students.map(s => 
        s.id === assignmentId 
          ? { ...s, checkOutTime: time }
          : s
      )
    }));
    
    const assignment = roster.students.find(s => s.id === assignmentId);
    if (assignment) {
      setSelectedAssignment({ ...assignment, checkOutTime: time });
      setVerifyDialogOpen(true);
    }
  };

  const handleVerify = () => {
    if (!selectedAssignment) return;

    setRoster(prev => ({
      ...prev,
      students: prev.students.map(s => 
        s.id === selectedAssignment.id 
          ? { 
              ...s, 
              status: 'COMPLETED' as UIStatus, 
              rating: verifyForm.rating,
              feedback: verifyForm.feedback,
              points: verifyForm.points
            }
          : s
      )
    }));

    setVerifyDialogOpen(false);
    setSelectedAssignment(null);
    setVerifyForm({ rating: 5, feedback: '', points: 10 });
    toast.success('Tugas berhasil diverifikasi');
  };

  const handleMarkMissed = (assignmentId: string) => {
    setRoster(prev => ({
      ...prev,
      students: prev.students.map(s => 
        s.id === assignmentId 
          ? { ...s, status: 'ABSENT' as UIStatus }
          : s
      )
    }));
    toast.warning('Santri ditandai tidak hadir');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCompletionStats = () => {
    const total = roster.students.length;
    const completed = roster.students.filter(s => s.status === 'COMPLETED').length;
    const inProgress = roster.students.filter(s => s.status === 'IN_PROGRESS').length;
    const scheduled = roster.students.filter(s => s.status === 'PENDING' || s.status === 'SCHEDULED').length;
    const missed = roster.students.filter(s => s.status === 'ABSENT' || s.status === 'MISSED').length;
    return { total, completed, inProgress, scheduled, missed };
  };

  const stats = getCompletionStats();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/duty-roster">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{DUTY_TYPE_LABELS[roster.dutyType]}</h1>
          <p className="text-muted-foreground">{formatDate(roster.date)}</p>
        </div>
      </div>

      {/* Roster Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Lokasi</p>
                <p className="font-medium">{roster.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Waktu</p>
                <p className="font-medium">{roster.startTime} - {roster.endTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={SHIFT_CONFIG[roster.shift].color}>
                {SHIFT_CONFIG[roster.shift].label}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Pengawas</p>
                <p className="font-medium">{roster.supervisor?.name || '-'}</p>
              </div>
            </div>
          </div>
          {roster.notes && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm"><strong>Catatan:</strong> {roster.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">Selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-sm text-muted-foreground">Berlangsung</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-gray-600">{stats.scheduled}</p>
            <p className="text-sm text-muted-foreground">Terjadwal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.missed}</p>
            <p className="text-sm text-muted-foreground">Tidak Hadir</p>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Santri Piket</CardTitle>
          <CardDescription>Kelola kehadiran dan verifikasi tugas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {roster.students.map(assignment => (
              <div 
                key={assignment.id}
                className={`p-4 rounded-lg border ${STATUS_CONFIG[assignment.status].bgColor}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{assignment.student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{assignment.student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.student.nis} • {assignment.student.class.name}
                      </p>
                    </div>
                  </div>
                  <Badge className={STATUS_CONFIG[assignment.status].color}>
                    <span className="flex items-center gap-1">
                      {STATUS_CONFIG[assignment.status].icon}
                      {STATUS_CONFIG[assignment.status].label}
                    </span>
                  </Badge>
                </div>

                {/* Time Info */}
                {(assignment.checkInTime || assignment.checkOutTime) && (
                  <div className="mt-3 flex items-center gap-6 text-sm">
                    {assignment.checkInTime && (
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4 text-green-600" />
                        <span>Check-in: {assignment.checkInTime}</span>
                      </div>
                    )}
                    {assignment.checkOutTime && (
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-blue-600" />
                        <span>Check-out: {assignment.checkOutTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Rating & Feedback */}
                {assignment.status === 'COMPLETED' && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= (assignment.rating || 0)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium">{assignment.rating}/5</span>
                      </div>
                      {assignment.points && (
                        <Badge className="bg-green-100 text-green-800">
                          +{assignment.points} poin
                        </Badge>
                      )}
                    </div>
                    {assignment.feedback && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-3 w-3 inline mr-1" />
                        {assignment.feedback}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {(assignment.status === 'PENDING' || assignment.status === 'SCHEDULED') && (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => handleCheckIn(assignment.id)}
                      >
                        <LogIn className="h-4 w-4 mr-1" />
                        Check-in
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleMarkMissed(assignment.id)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Tidak Hadir
                      </Button>
                    </>
                  )}
                  {assignment.status === 'IN_PROGRESS' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleCheckOut(assignment.id)}
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Check-out & Verifikasi
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi Tugas Piket</DialogTitle>
            <DialogDescription>
              Berikan penilaian untuk {selectedAssignment?.student.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setVerifyForm(prev => ({ ...prev, rating: star, points: star * 2 }))}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= verifyForm.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-lg font-medium">{verifyForm.rating}/5</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Poin yang Diberikan</Label>
              <div className="flex items-center gap-2">
                <Badge className="text-lg px-4 py-2 bg-green-100 text-green-800">
                  +{verifyForm.points} poin
                </Badge>
                <span className="text-sm text-muted-foreground">(otomatis berdasarkan rating)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Feedback (opsional)</Label>
              <Textarea
                placeholder="Berikan catatan atau masukan..."
                value={verifyForm.feedback}
                onChange={(e) => setVerifyForm(prev => ({ ...prev, feedback: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleVerify}>
              <Save className="h-4 w-4 mr-2" />
              Verifikasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
