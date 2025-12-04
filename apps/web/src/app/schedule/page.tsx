'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, BookOpen, Users, Coffee, Utensils, Moon } from 'lucide-react';

interface ScheduleItem {
  id: string;
  time: string;
  activity: string;
  type: 'tahfidz' | 'academic' | 'worship' | 'break' | 'meal' | 'rest';
  location?: string;
  teacher?: string;
}

const dailySchedule: ScheduleItem[] = [
  { id: '1', time: '04:30 - 05:00', activity: 'Bangun & Persiapan Subuh', type: 'rest' },
  { id: '2', time: '05:00 - 05:30', activity: 'Sholat Subuh Berjamaah', type: 'worship', location: 'Masjid' },
  { id: '3', time: '05:30 - 06:30', activity: 'Tahfidz Pagi (Setoran)', type: 'tahfidz', location: 'Ruang Tahfidz', teacher: 'Ust. Ahmad' },
  { id: '4', time: '06:30 - 07:00', activity: 'Sarapan', type: 'meal', location: 'Kantin' },
  { id: '5', time: '07:00 - 07:30', activity: 'Persiapan Sekolah', type: 'break' },
  { id: '6', time: '07:30 - 09:00', activity: 'Pelajaran 1-2', type: 'academic', location: 'Kelas 7A' },
  { id: '7', time: '09:00 - 09:30', activity: 'Istirahat', type: 'break' },
  { id: '8', time: '09:30 - 11:00', activity: 'Pelajaran 3-4', type: 'academic', location: 'Kelas 7A' },
  { id: '9', time: '11:00 - 11:30', activity: 'Istirahat', type: 'break' },
  { id: '10', time: '11:30 - 12:30', activity: 'Pelajaran 5-6', type: 'academic', location: 'Kelas 7A' },
  { id: '11', time: '12:30 - 13:00', activity: 'Sholat Dzuhur Berjamaah', type: 'worship', location: 'Masjid' },
  { id: '12', time: '13:00 - 13:30', activity: 'Makan Siang', type: 'meal', location: 'Kantin' },
  { id: '13', time: '13:30 - 15:00', activity: 'Tahfidz Siang (Murojaah)', type: 'tahfidz', location: 'Ruang Tahfidz', teacher: 'Ustzh. Fatimah' },
  { id: '14', time: '15:00 - 15:30', activity: 'Sholat Ashar Berjamaah', type: 'worship', location: 'Masjid' },
  { id: '15', time: '15:30 - 17:00', activity: 'Kegiatan Ekskul / Olahraga', type: 'break', location: 'Lapangan' },
  { id: '16', time: '17:00 - 18:00', activity: 'Persiapan Maghrib', type: 'rest' },
  { id: '17', time: '18:00 - 18:30', activity: 'Sholat Maghrib Berjamaah', type: 'worship', location: 'Masjid' },
  { id: '18', time: '18:30 - 19:30', activity: 'Makan Malam & Istirahat', type: 'meal', location: 'Kantin' },
  { id: '19', time: '19:30 - 20:00', activity: 'Sholat Isya Berjamaah', type: 'worship', location: 'Masjid' },
  { id: '20', time: '20:00 - 21:30', activity: 'Belajar Malam', type: 'academic', location: 'Asrama' },
  { id: '21', time: '21:30 - 04:30', activity: 'Istirahat Malam', type: 'rest', location: 'Asrama' },
];

const weeklySchedule = [
  { day: 'Senin', highlight: 'Tahfidz & Pelajaran Formal' },
  { day: 'Selasa', highlight: 'Tahfidz & Pelajaran Formal' },
  { day: 'Rabu', highlight: 'Tahfidz & Pelajaran Formal' },
  { day: 'Kamis', highlight: 'Tahfidz & Pelajaran Formal + Setoran Juz' },
  { day: 'Jumat', highlight: 'Sholat Jumat & Kegiatan Keagamaan' },
  { day: 'Sabtu', highlight: 'Ekstrakurikuler & Olahraga' },
  { day: 'Minggu', highlight: 'Libur / Kegiatan Keluarga' },
];

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState('today');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tahfidz':
        return <BookOpen className="h-4 w-4" />;
      case 'academic':
        return <Users className="h-4 w-4" />;
      case 'worship':
        return <Moon className="h-4 w-4" />;
      case 'break':
        return <Coffee className="h-4 w-4" />;
      case 'meal':
        return <Utensils className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'tahfidz':
        return <Badge className="bg-green-500">Tahfidz</Badge>;
      case 'academic':
        return <Badge className="bg-blue-500">Akademik</Badge>;
      case 'worship':
        return <Badge className="bg-purple-500">Ibadah</Badge>;
      case 'break':
        return <Badge variant="secondary">Istirahat</Badge>;
      case 'meal':
        return <Badge className="bg-orange-500">Makan</Badge>;
      default:
        return <Badge variant="outline">Lainnya</Badge>;
    }
  };

  const getCurrentActivity = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    for (const item of dailySchedule) {
      const [start] = item.time.split(' - ');
      const [startHour, startMinute] = start.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;

      const [, end] = item.time.split(' - ');
      const [endHour, endMinute] = end.split(':').map(Number);
      const endTime = endHour * 60 + endMinute;

      if (currentTime >= startTime && currentTime < endTime) {
        return item;
      }
    }
    return null;
  };

  const currentActivity = getCurrentActivity();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Jadwal Kegiatan
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Current Activity Card */}
      {currentActivity && (
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-white/20">
                {getTypeIcon(currentActivity.type)}
              </div>
              <div>
                <p className="text-sm opacity-80">Kegiatan Saat Ini</p>
                <h3 className="text-xl font-bold">{currentActivity.activity}</h3>
                <p className="text-sm opacity-80">
                  {currentActivity.time}
                  {currentActivity.location && ` • ${currentActivity.location}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Jadwal Harian</TabsTrigger>
          <TabsTrigger value="weekly">Jadwal Mingguan</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Jadwal Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailySchedule.map((item, index) => {
                  const isCurrent = currentActivity?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        isCurrent ? 'bg-green-50 border border-green-200' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="w-24 text-sm font-medium text-muted-foreground">
                        {item.time.split(' - ')[0]}
                      </div>
                      <div className="p-2 rounded-lg bg-muted">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.activity}</p>
                        {(item.location || item.teacher) && (
                          <p className="text-sm text-muted-foreground">
                            {item.location}
                            {item.teacher && ` • ${item.teacher}`}
                          </p>
                        )}
                      </div>
                      {getTypeBadge(item.type)}
                      {isCurrent && (
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Jadwal Mingguan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {weeklySchedule.map((day) => {
                  const isToday = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase() === day.day.toLowerCase();
                  return (
                    <Card key={day.day} className={isToday ? 'border-green-500 bg-green-50' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{day.day}</h4>
                          {isToday && <Badge className="bg-green-500">Hari Ini</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{day.highlight}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
