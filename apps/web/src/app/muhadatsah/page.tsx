"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  MessageSquare,
  Calendar,
  Users,
  Trophy,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  Languages,
  UserPlus,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  useMuhadatsahList,
  useUpcomingMuhadatsah,
  useMuhadatsahStatistics,
  useTopPerformers,
  useMatchPartners,
  getStatusColor,
  getStatusLabel,
  getGradeColor,
  getLanguageLabel,
  getLanguageIcon,
  formatDuration,
  MuhadatsahStatus,
} from "@/hooks/use-muhadatsah";
import { useAuthStore } from "@/stores/auth";

// Demo data
const DEMO_RECORDS = [
  {
    id: "1",
    topic: "في السوق - Di Pasar",
    student: {
      id: "s1",
      nis: "2024001",
      name: "Ahmad Fauzi",
      class: { name: "IX A" },
    },
    partner: { id: "s2", nis: "2024002", name: "Muhammad Rizki" },
    scheduledAt: "2024-03-15T09:00:00.000Z",
    language: "Arabic",
    status: "SCHEDULED" as MuhadatsahStatus,
    totalScore: null,
    grade: null,
    duration: null,
  },
  {
    id: "2",
    topic: "Daily Routine",
    student: {
      id: "s3",
      nis: "2024003",
      name: "Fatimah Zahra",
      class: { name: "VIII A" },
    },
    partner: { id: "s4", nis: "2024004", name: "Khadijah Nur" },
    scheduledAt: "2024-03-10T09:00:00.000Z",
    language: "English",
    status: "COMPLETED" as MuhadatsahStatus,
    totalScore: 88,
    grade: "B",
    duration: 10,
  },
  {
    id: "3",
    topic: "في المدرسة - Di Sekolah",
    student: {
      id: "s5",
      nis: "2024005",
      name: "Ibrahim Malik",
      class: { name: "VII A" },
    },
    partner: { id: "s6", nis: "2024006", name: "Yusuf Abdillah" },
    scheduledAt: "2024-03-09T14:00:00.000Z",
    language: "Arabic",
    status: "COMPLETED" as MuhadatsahStatus,
    totalScore: 92,
    grade: "A",
    duration: 15,
  },
  {
    id: "4",
    topic: "At the Hospital",
    student: {
      id: "s7",
      nis: "2024007",
      name: "Aisyah Putri",
      class: { name: "IX B" },
    },
    partner: null,
    scheduledAt: "2024-03-08T10:00:00.000Z",
    language: "English",
    status: "CANCELLED" as MuhadatsahStatus,
    totalScore: null,
    grade: null,
    duration: null,
  },
];

// Demo upcoming
const DEMO_UPCOMING_RECORDS = [
  {
    id: "u1",
    student: { name: "Ahmad Fauzi" },
    partner: { name: "Muhammad Rizki" },
    topic: "في السوق",
    scheduledAt: "2024-03-15T09:00:00.000Z",
    language: "Arabic",
  },
  {
    id: "u2",
    student: { name: "Siti Aisyah" },
    partner: { name: "Fatimah Zahra" },
    topic: "At the Library",
    scheduledAt: "2024-03-16T09:00:00.000Z",
    language: "English",
  },
];

export default function MuhadatsahPage() {
  const { user } = useAuthStore();
  const unitId = user?.unitId || user?.unit?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MuhadatsahStatus | "ALL">(
    "ALL",
  );
  const [languageFilter, setLanguageFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data with auth context unitId
  const { data: listData, isLoading: isLoadingList } = useMuhadatsahList({
    page: currentPage,
    limit: 10,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    language: languageFilter === "ALL" ? undefined : languageFilter,
  });

  const { data: upcomingData } = useUpcomingMuhadatsah(unitId, 5);
  const { data: statsData } = useMuhadatsahStatistics(unitId);
  const { data: topPerformersData } = useTopPerformers(unitId, undefined, 5);
  const { data: availablePartnersData } = useMatchPartners(unitId, "Arabic");

  const records = listData?.data || DEMO_RECORDS;
  const meta = listData?.meta || {
    total: DEMO_RECORDS.length,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  // Filter by search
  const filteredRecords = (records || []).filter((record) => {
    if (!searchQuery) return true;
    if (!record) return false;
    const query = searchQuery.toLowerCase();
    const studentName = record.student?.name || "";
    const studentNis = record.student?.nis || "";
    const partnerName = record.partner?.name || "";
    const topic = record.topic || "";

    return (
      topic.toLowerCase().includes(query) ||
      studentName.toLowerCase().includes(query) ||
      studentNis.toLowerCase().includes(query) ||
      partnerName.toLowerCase().includes(query)
    );
  });

  // Demo stats
  const stats = statsData || {
    total: 234,
    byStatus: [
      { status: "COMPLETED", count: 198 },
      { status: "SCHEDULED", count: 32 },
      { status: "CANCELLED", count: 4 },
    ],
    byLanguage: [
      { language: "Arabic", count: 156 },
      { language: "English", count: 78 },
    ],
    averages: {
      fluency: 76.5,
      grammar: 74.2,
      vocabulary: 78.8,
      pronunciation: 72.4,
      total: 75.5,
    },
  };

  // Demo top performers
  const topPerformers = topPerformersData || [
    {
      studentId: "s1",
      name: "Fatimah Zahra",
      nis: "2024003",
      class: "VIII A",
      averageScore: 92,
      totalSessions: 18,
    },
    {
      studentId: "s2",
      name: "Ahmad Fauzi",
      nis: "2024001",
      class: "IX A",
      averageScore: 88,
      totalSessions: 22,
    },
    {
      studentId: "s3",
      name: "Muhammad Rizki",
      nis: "2024002",
      class: "IX B",
      averageScore: 86,
      totalSessions: 15,
    },
    {
      studentId: "s4",
      name: "Khadijah Nur",
      nis: "2024005",
      class: "VII B",
      averageScore: 84,
      totalSessions: 12,
    },
    {
      studentId: "s5",
      name: "Ibrahim Malik",
      nis: "2024004",
      class: "VII A",
      averageScore: 82,
      totalSessions: 14,
    },
  ];

  const upcomingRecords = upcomingData || DEMO_UPCOMING_RECORDS;

  // Demo available partners
  const availablePartners = availablePartnersData || [
    { id: "p1", nis: "2024010", name: "Ali Imran", class: { name: "VIII A" } },
    {
      id: "p2",
      nis: "2024011",
      name: "Bilal Ahmad",
      class: { name: "VIII B" },
    },
    {
      id: "p3",
      nis: "2024012",
      name: "Hamzah Yusuf",
      class: { name: "VII A" },
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Muhadatsah
          </h1>
          <p className="text-muted-foreground mt-1">
            Latihan percakapan bahasa Arab dan Inggris santri
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Jadwalkan Muhadatsah
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sesi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Semester ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byStatus?.find((s) => s.status === "COMPLETED")?.count ||
                0}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                ((stats?.byStatus?.find((s) => s.status === "COMPLETED")
                  ?.count || 0) /
                  (stats?.total || 1)) *
                  100,
              )}
              % completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terjadwal</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byStatus?.find((s) => s.status === "SCHEDULED")?.count ||
                0}
            </div>
            <p className="text-xs text-muted-foreground">
              Menunggu pelaksanaan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rata-rata Nilai
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.averages?.total || 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Dari 100 poin</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Daftar Muhadatsah</TabsTrigger>
          <TabsTrigger value="upcoming">Jadwal Mendatang</TabsTrigger>
          <TabsTrigger value="partners">Cari Partner</TabsTrigger>
          <TabsTrigger value="statistics">Statistik</TabsTrigger>
          <TabsTrigger value="leaderboard">Peringkat</TabsTrigger>
        </TabsList>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari santri atau topik..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v as MuhadatsahStatus | "ALL")
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Status</SelectItem>
                    <SelectItem value="SCHEDULED">Terjadwal</SelectItem>
                    <SelectItem value="COMPLETED">Selesai</SelectItem>
                    <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={languageFilter}
                  onValueChange={setLanguageFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Bahasa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Bahasa</SelectItem>
                    <SelectItem value="Arabic">Bahasa Arab</SelectItem>
                    <SelectItem value="English">Bahasa Inggris</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peserta</TableHead>
                    <TableHead>Topik</TableHead>
                    <TableHead>Bahasa</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            <Avatar className="h-8 w-8 border-2 border-background">
                              <AvatarFallback className="text-xs">
                                {record.student?.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {record.partner && (
                              <Avatar className="h-8 w-8 border-2 border-background">
                                <AvatarFallback className="text-xs">
                                  {record.partner.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {record.student?.name || "-"}
                              {record.partner?.name && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  & {record.partner.name}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {record.student?.class?.name || "-"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {record.topic || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <span>{getLanguageIcon(record.language)}</span>
                          {getLanguageLabel(record.language)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.scheduledAt
                          ? format(
                              new Date(record.scheduledAt),
                              "dd MMM yyyy, HH:mm",
                              { locale: localeId },
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusLabel(record.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.totalScore ? (
                          <div className="flex items-center gap-2">
                            <Badge className={getGradeColor(record.grade)}>
                              {record.grade}
                            </Badge>
                            <span className="text-sm">{record.totalScore}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {record.status === "SCHEDULED" && (
                            <>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {filteredRecords.length} dari {meta.total} data
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= meta.totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Muhadatsah Mendatang</CardTitle>
              <CardDescription>
                Sesi muhadatsah yang akan dilaksanakan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingRecords.map((record, index) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {record.student?.name}
                          {record.partner && (
                            <span className="text-muted-foreground">
                              {" "}
                              & {record.partner.name}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.topic}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="gap-1">
                        <span>{getLanguageIcon(record.language)}</span>
                        {getLanguageLabel(record.language)}
                      </Badge>
                      <div className="text-sm text-right">
                        <div className="font-medium">
                          {format(new Date(record.scheduledAt), "dd MMM yyyy", {
                            locale: localeId,
                          })}
                        </div>
                        <div className="text-muted-foreground">
                          {format(new Date(record.scheduledAt), "HH:mm", {
                            locale: localeId,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partner Matching Tab */}
        <TabsContent value="partners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Cari Partner Muhadatsah
              </CardTitle>
              <CardDescription>
                Santri yang tersedia untuk dipasangkan minggu ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select defaultValue="Arabic">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Pilih Bahasa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arabic">🕌 Bahasa Arab</SelectItem>
                    <SelectItem value="English">🇬🇧 Bahasa Inggris</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availablePartners.map((partner) => (
                  <Card
                    key={partner.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {partner.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{partner.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {partner.nis} • {partner.class?.name}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Pilih
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Rata-rata Komponen Nilai
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kelancaran (Fluency)</span>
                    <span className="font-medium">
                      {(stats?.averages?.fluency || 0).toFixed(1)}
                    </span>
                  </div>
                  <Progress
                    value={stats?.averages?.fluency || 0}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tata Bahasa (Grammar)</span>
                    <span className="font-medium">
                      {(stats?.averages?.grammar || 0).toFixed(1)}
                    </span>
                  </div>
                  <Progress
                    value={stats?.averages?.grammar || 0}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kosakata (Vocabulary)</span>
                    <span className="font-medium">
                      {(stats?.averages?.vocabulary || 0).toFixed(1)}
                    </span>
                  </div>
                  <Progress
                    value={stats?.averages?.vocabulary || 0}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pengucapan (Pronunciation)</span>
                    <span className="font-medium">
                      {(stats?.averages?.pronunciation || 0).toFixed(1)}
                    </span>
                  </div>
                  <Progress
                    value={stats?.averages?.pronunciation || 0}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Language Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Distribusi Bahasa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byLanguage.map((item) => (
                    <div
                      key={item.language}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getLanguageIcon(item.language)}
                        </span>
                        <span className="font-medium">
                          {getLanguageLabel(item.language)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">{item.count}</span>
                        <Badge variant="secondary">
                          {Math.round((item.count / stats.total) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Santri dengan nilai rata-rata terbaik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div
                    key={performer.studentId}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0
                        ? "bg-yellow-50 border border-yellow-200"
                        : index === 1
                          ? "bg-gray-50 border border-gray-200"
                          : index === 2
                            ? "bg-orange-50 border border-orange-200"
                            : "border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-white"
                            : index === 1
                              ? "bg-gray-400 text-white"
                              : index === 2
                                ? "bg-orange-500 text-white"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{performer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {performer.nis} • {performer.class}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold text-lg">
                          {performer.averageScore.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {performer.totalSessions} sesi
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
