'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Trophy, 
  Medal,
  Crown,
  Flame,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock leaderboard data
const mockLeaderboard = [
  { rank: 1, name: 'Muhammad Hasan', class: 'VII A', score: 980, streak: 30, avatar: '🥇' },
  { rank: 2, name: 'Fatimah Azzahra', class: 'VII B', score: 945, streak: 28, avatar: '🥈' },
  { rank: 3, name: 'Ahmad Fadlan', class: 'VIII A', score: 920, streak: 25, avatar: '🥉' },
  { rank: 4, name: 'Aisyah Putri', class: 'VI A', score: 890, streak: 22, avatar: '👤' },
  { rank: 5, name: 'Umar Faruq', class: 'VIII B', score: 875, streak: 20, avatar: '👤' },
  { rank: 6, name: 'Khadijah Nur', class: 'VII A', score: 860, streak: 18, avatar: '👤' },
  { rank: 7, name: 'Ibrahim Malik', class: 'VI B', score: 845, streak: 17, avatar: '👤' },
  { rank: 8, name: 'Zainab Sari', class: 'VIII A', score: 830, streak: 15, avatar: '👤' },
  { rank: 9, name: 'Yusuf Hakim', class: 'VII B', score: 815, streak: 14, avatar: '👤' },
  { rank: 10, name: 'Maryam Dewi', class: 'VI A', score: 800, streak: 12, avatar: '👤' },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Medal className="h-6 w-6 text-amber-600" />;
    default:
      return <span className="font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300';
    case 2:
      return 'bg-gradient-to-r from-gray-100 to-slate-100 border-gray-300';
    case 3:
      return 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300';
    default:
      return 'bg-background hover:bg-muted/50';
  }
};

export default function IbadahLeaderboardPage() {
  const [period, setPeriod] = useState('week');
  const [category, setCategory] = useState('all');

  // Find current user position (mock)
  const currentUserRank = 15;
  const currentUserScore = 720;

  return (
    <MainLayout allowedRoles={['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'UNIT_ADMIN', 'PARENT']}>
      <div className="space-y-6">
        <PageHeader
          title="Papan Peringkat Ibadah"
          description="Kompetisi amaliyah harian santri"
        />

        {/* Top 3 Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {mockLeaderboard.slice(0, 3).map((student, index) => (
            <Card
              key={student.rank}
              className={cn(
                'relative overflow-hidden',
                index === 0 && 'md:order-2 md:scale-105 z-10',
                index === 1 && 'md:order-1',
                index === 2 && 'md:order-3'
              )}
            >
              <div
                className={cn(
                  'absolute inset-0 opacity-10',
                  index === 0 && 'bg-yellow-500',
                  index === 1 && 'bg-gray-500',
                  index === 2 && 'bg-amber-500'
                )}
              />
              <CardContent className="pt-6 text-center relative">
                <div className="text-5xl mb-2">{student.avatar}</div>
                <div className="mb-2">{getRankIcon(student.rank)}</div>
                <h3 className="font-bold text-lg">{student.name}</h3>
                <p className="text-sm text-muted-foreground">{student.class}</p>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{student.score}</p>
                    <p className="text-xs text-muted-foreground">Poin</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span className="text-xl font-bold">{student.streak}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="semester">Semester</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Ibadah</SelectItem>
              <SelectItem value="sholat">Sholat</SelectItem>
              <SelectItem value="tilawah">Tilawah</SelectItem>
              <SelectItem value="dzikir">Dzikir</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Your Position Card */}
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Posisi Kamu</p>
                  <p className="text-sm text-muted-foreground">Terus tingkatkan ibadahmu!</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">#{currentUserRank}</p>
                  <p className="text-xs text-muted-foreground">Peringkat</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{currentUserScore}</p>
                  <p className="text-xs text-muted-foreground">Poin</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 10 Santri
            </CardTitle>
            <CardDescription>Berdasarkan total poin ibadah</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockLeaderboard.map((student) => (
                <div
                  key={student.rank}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-xl transition-all',
                    getRankBg(student.rank)
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getRankIcon(student.rank)}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">{student.streak}</span>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3">
                      {student.score}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
