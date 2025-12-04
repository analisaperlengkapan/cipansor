'use client';

import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useClassSchedule, 
  Schedule, 
  SCHEDULE_DAYS, 
  SCHEDULE_DAY_LABELS, 
  ScheduleDay 
} from '@/hooks/use-curriculum';
import { useClasses } from '@/hooks/use-classes';
import { useAcademicYears } from '@/hooks/use-academic-years';
import { 
  CalendarDays, 
  Clock, 
  User, 
  BookOpen, 
  MapPin, 
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  School
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Time slots for the timetable (typical school hours)
const TIME_SLOTS = [
  { start: '07:00', end: '07:45', label: 'Jam 1' },
  { start: '07:45', end: '08:30', label: 'Jam 2' },
  { start: '08:30', end: '09:15', label: 'Jam 3' },
  { start: '09:15', end: '09:30', label: 'Istirahat 1', isBreak: true },
  { start: '09:30', end: '10:15', label: 'Jam 4' },
  { start: '10:15', end: '11:00', label: 'Jam 5' },
  { start: '11:00', end: '11:45', label: 'Jam 6' },
  { start: '11:45', end: '12:30', label: 'Sholat & Istirahat', isBreak: true },
  { start: '12:30', end: '13:15', label: 'Jam 7' },
  { start: '13:15', end: '14:00', label: 'Jam 8' },
  { start: '14:00', end: '14:45', label: 'Jam 9' },
  { start: '14:45', end: '15:30', label: 'Jam 10' },
  { start: '15:30', end: '16:00', label: 'Sholat Ashar', isBreak: true },
];

// Subject colors for visual distinction
const SUBJECT_COLORS: Record<string, string> = {
  'MTK': 'bg-blue-100 border-blue-300 text-blue-800',
  'IPA': 'bg-green-100 border-green-300 text-green-800',
  'IPS': 'bg-yellow-100 border-yellow-300 text-yellow-800',
  'BIN': 'bg-red-100 border-red-300 text-red-800',
  'BIG': 'bg-purple-100 border-purple-300 text-purple-800',
  'PAI': 'bg-emerald-100 border-emerald-300 text-emerald-800',
  'THF': 'bg-teal-100 border-teal-300 text-teal-800',
  'QUR': 'bg-cyan-100 border-cyan-300 text-cyan-800',
  'PKN': 'bg-orange-100 border-orange-300 text-orange-800',
  'PJK': 'bg-pink-100 border-pink-300 text-pink-800',
  'SEN': 'bg-indigo-100 border-indigo-300 text-indigo-800',
  'DEFAULT': 'bg-gray-100 border-gray-300 text-gray-800',
};

function getSubjectColor(code?: string): string {
  if (!code) return SUBJECT_COLORS.DEFAULT;
  const upperCode = code.toUpperCase().substring(0, 3);
  return SUBJECT_COLORS[upperCode] || SUBJECT_COLORS.DEFAULT;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5);
}

export default function TimetablePage() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: classesData, isLoading: classesLoading } = useClasses({});
  const classes = classesData?.data || [];
  const { data: academicYearsData, isLoading: yearsLoading } = useAcademicYears();
  const academicYears = academicYearsData?.data || [];
  const { data: schedules = [], isLoading: schedulesLoading } = useClassSchedule(
    selectedClassId,
    selectedAcademicYearId || undefined
  );

  // Get active academic year as default
  const activeYear = academicYears.find((y: { isActive: boolean }) => y.isActive);
  
  // Set default academic year when loaded
  if (activeYear && !selectedAcademicYearId) {
    setSelectedAcademicYearId(activeYear.id);
  }

  // Filter to only show school days (exclude Sunday typically)
  const SCHOOL_DAYS: ScheduleDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  // Organize schedules by day and time
  const scheduleGrid = useMemo(() => {
    const grid: Record<ScheduleDay, Schedule[]> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    };

    schedules.forEach(schedule => {
      if (schedule.day && grid[schedule.day]) {
        grid[schedule.day].push(schedule);
      }
    });

    // Sort each day's schedules by start time
    Object.keys(grid).forEach(day => {
      grid[day as ScheduleDay].sort((a, b) => 
        parseTime(a.startTime) - parseTime(b.startTime)
      );
    });

    return grid;
  }, [schedules]);

  // Find schedule for a specific time slot and day
  const getScheduleForSlot = (day: ScheduleDay, slot: typeof TIME_SLOTS[0]): Schedule | null => {
    const daySchedules = scheduleGrid[day];
    return daySchedules.find(s => {
      const scheduleStart = parseTime(formatTime(s.startTime));
      const scheduleEnd = parseTime(formatTime(s.endTime));
      const slotStart = parseTime(slot.start);
      const slotEnd = parseTime(slot.end);
      
      // Check if schedule overlaps with this slot
      return scheduleStart <= slotStart && scheduleEnd >= slotEnd;
    }) || null;
  };

  const handlePrint = () => {
    window.print();
    toast.success('Jadwal siap dicetak');
  };

  const handleExport = () => {
    // Export to CSV
    if (!schedules.length) {
      toast.error('Tidak ada jadwal untuk diexport');
      return;
    }

    const exportClass = classes.find((c: { id: string }) => c.id === selectedClassId);
    const headers = ['Hari', 'Jam Mulai', 'Jam Selesai', 'Mata Pelajaran', 'Guru', 'Ruangan'];
    const rows = schedules.map(s => [
      SCHEDULE_DAY_LABELS[s.day],
      s.startTime,
      s.endTime,
      s.subject?.name || '-',
      s.teacher?.name || '-',
      s.room || '-'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jadwal-${exportClass?.name || 'kelas'}.csv`;
    link.click();
    
    toast.success('Jadwal berhasil diexport');
  };

  const selectedClass = classes.find((c: { id: string }) => c.id === selectedClassId);
  const selectedYear = academicYears.find((y: { id: string }) => y.id === selectedAcademicYearId);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Jadwal Pelajaran
            </h1>
            <p className="text-muted-foreground">
              Tampilan jadwal mingguan per kelas dalam bentuk grid
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/curriculum/schedules">
                <List className="h-4 w-4 mr-2" />
                Kelola Jadwal
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Academic Year Select */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Tahun Ajaran</label>
                {yearsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select 
                    value={selectedAcademicYearId} 
                    onValueChange={setSelectedAcademicYearId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tahun ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name} {year.isActive && '(Aktif)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Class Select */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Kelas</label>
                {classesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select 
                    value={selectedClassId} 
                    onValueChange={setSelectedClassId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.unit?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  title="Tampilan Grid"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  title="Tampilan List"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint} disabled={!selectedClassId}>
                  <Printer className="h-4 w-4 mr-2" />
                  Cetak
                </Button>
                <Button variant="outline" onClick={handleExport} disabled={!selectedClassId}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timetable Display */}
        {!selectedClassId ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <School className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Pilih kelas untuk melihat jadwal</p>
              </div>
            </CardContent>
          </Card>
        ) : schedulesLoading ? (
          <Card>
            <CardContent className="py-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <Card className="print:shadow-none">
            <CardHeader className="print:pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Jadwal Kelas {selectedClass?.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedYear?.name} - {selectedClass?.unit?.name}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="print:hidden">
                  {schedules.length} Jadwal
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 bg-gray-50 p-2 text-left font-semibold w-24">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Waktu</span>
                        </div>
                      </th>
                      {SCHOOL_DAYS.map(day => (
                        <th 
                          key={day} 
                          className="border border-gray-300 bg-gray-50 p-2 text-center font-semibold"
                        >
                          {SCHEDULE_DAY_LABELS[day]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot, idx) => (
                      <tr key={idx} className={slot.isBreak ? 'bg-amber-50' : ''}>
                        <td className="border border-gray-300 p-2 text-sm">
                          <div className="font-medium">{slot.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {slot.start} - {slot.end}
                          </div>
                        </td>
                        {SCHOOL_DAYS.map(day => {
                          if (slot.isBreak) {
                            return (
                              <td 
                                key={day} 
                                className="border border-gray-300 p-2 text-center text-sm text-muted-foreground italic bg-amber-50"
                              >
                                {slot.label}
                              </td>
                            );
                          }

                          const schedule = getScheduleForSlot(day, slot);
                          
                          if (schedule) {
                            return (
                              <td 
                                key={day} 
                                className={`border border-gray-300 p-1 ${getSubjectColor(schedule.subject?.code)}`}
                              >
                                <div className="text-xs space-y-0.5">
                                  <div className="font-semibold truncate" title={schedule.subject?.name}>
                                    {schedule.subject?.name || schedule.subject?.code}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] opacity-75">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{schedule.teacher?.name || '-'}</span>
                                  </div>
                                  {schedule.room && (
                                    <div className="flex items-center gap-1 text-[10px] opacity-75">
                                      <MapPin className="h-3 w-3" />
                                      <span>{schedule.room}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td 
                              key={day} 
                              className="border border-gray-300 p-2 text-center text-muted-foreground"
                            >
                              -
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t print:hidden">
                <p className="text-sm font-medium mb-2">Keterangan Warna:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SUBJECT_COLORS).filter(([key]) => key !== 'DEFAULT').slice(0, 8).map(([code, colorClass]) => (
                    <Badge key={code} variant="outline" className={colorClass}>
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* List View */
          <div className="space-y-4">
            {SCHOOL_DAYS.map(day => {
              const daySchedules = scheduleGrid[day];
              if (daySchedules.length === 0) return null;

              return (
                <Card key={day}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {SCHEDULE_DAY_LABELS[day]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {daySchedules.map(schedule => (
                        <div 
                          key={schedule.id}
                          className={`flex items-center gap-4 p-3 rounded-lg border ${getSubjectColor(schedule.subject?.code)}`}
                        >
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{schedule.subject?.name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {schedule.teacher?.name || '-'}
                              </span>
                              {schedule.room && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {schedule.room}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {schedule.subject?.code}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {schedules.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Belum ada jadwal untuk kelas ini</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/curriculum/schedules/new">
                        Tambah Jadwal Baru
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:shadow-none,
            .print\\:shadow-none * {
              visibility: visible;
            }
            .print\\:shadow-none {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:pb-2 {
              padding-bottom: 0.5rem;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
