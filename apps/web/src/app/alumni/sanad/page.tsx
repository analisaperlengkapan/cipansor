"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Award,
  Search,
  User,
  GitBranch,
  BookOpen,
  Calendar,
  Download,
  ChevronDown,
  ChevronUp,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlumni, useAlumniStats } from "@/hooks/use-alumni";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

// Sanad chain data structure
interface SanadNode {
  id: string;
  name: string;
  title: string;
  year: string;
  location?: string;
  specialty: string;
  children?: SanadNode[];
}

// Mock sanad chain data - showing isnad (chain of transmission)
// This is static institutional data representing the chain of transmission (silsilah)
const mockSanadChain: SanadNode = {
  id: "root",
  name: "Syaikh Abdul Qadir Al-Arnauth",
  title: "محدث الشام",
  year: "1928-2004",
  location: "Damascus, Syria",
  specialty: "Hadits & Tahqiq",
  children: [
    {
      id: "level1-1",
      name: "KH. Muhammad Salim",
      title: "مشايخ الحديث",
      year: "1945-2020",
      location: "Pesantren Al-Hikmah",
      specialty: "Hadits",
      children: [
        {
          id: "level2-1",
          name: "Ust. Ahmad Fadlan, Lc.",
          title: "معلم القرآن",
          year: "1975-",
          location: "Pesantren Al-Hikmah",
          specialty: "Tahfidz & Qiroah",
          children: [
            {
              id: "level3-1",
              name: "Muhammad Hasan",
              title: "Hafizh",
              year: "2010-",
              specialty: "30 Juz bi Sanad",
            },
            {
              id: "level3-2",
              name: "Fatimah Azzahra",
              title: "Hafizhah",
              year: "2011-",
              specialty: "30 Juz bi Sanad",
            },
          ],
        },
        {
          id: "level2-2",
          name: "Ust. Ibrahim Hakim, Lc.",
          title: "معلم القرآن",
          year: "1980-",
          location: "Pesantren Al-Hikmah",
          specialty: "Tahfidz & Tajwid",
          children: [
            {
              id: "level3-3",
              name: "Ahmad Syakir",
              title: "Hafizh",
              year: "2009-",
              specialty: "30 Juz bi Sanad",
            },
          ],
        },
      ],
    },
  ],
};

// Hook to fetch alumni with sanad data
function useAlumniWithSanad(params?: {
  search?: string;
  graduationYear?: string;
}) {
  return useQuery({
    queryKey: ["alumni-sanad", params],
    queryFn: async () => {
      // Try to get sanad data, fallback to alumni data
      try {
        const response = await api.get("/sanad", {
          params: {
            limit: 50,
            ...params,
          },
        });
        // Map sanad data to alumni format
        const sanadRecords = response.data.data || [];
        const uniqueStudents = new Map();
        for (const record of sanadRecords) {
          const studentId = record.enrollment?.student?.id || record.id;
          if (!uniqueStudents.has(studentId)) {
            uniqueStudents.set(studentId, {
              id: studentId,
              name:
                record.enrollment?.student?.user?.name ||
                record.enrollment?.student?.name ||
                "Unknown",
              graduationYear: new Date(record.certifiedAt).getFullYear(),
              sanadCount: 1,
              juzCount: record.juz || 0,
              status: record.status || "verified",
            });
          } else {
            const existing = uniqueStudents.get(studentId);
            existing.sanadCount += 1;
            existing.juzCount = Math.max(existing.juzCount, record.juz || 0);
          }
        }
        return Array.from(uniqueStudents.values());
      } catch {
        // Return empty array if API fails
        return [];
      }
    },
  });
}

// Recursive component for rendering sanad tree
function SanadTreeNode({
  node,
  level = 0,
  isExpanded = true,
}: {
  node: SanadNode;
  level?: number;
  isExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(isExpanded);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative">
      {/* Connection line to parent */}
      {level > 0 && (
        <div className="absolute -top-4 left-6 w-0.5 h-4 bg-primary/30" />
      )}

      <div
        className={cn(
          "relative flex items-start gap-4 p-4 rounded-xl border transition-all",
          level === 0
            ? "bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-300"
            : level === 1
              ? "bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-300 ml-8"
              : level === 2
                ? "bg-gradient-to-r from-green-50 to-green-100/50 border-green-300 ml-16"
                : "bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-300 ml-24",
        )}
      >
        {/* Connector line */}
        {level > 0 && (
          <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-primary/30" />
        )}

        {/* Avatar */}
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0",
            level === 0
              ? "bg-amber-500"
              : level === 1
                ? "bg-blue-500"
                : level === 2
                  ? "bg-green-500"
                  : "bg-purple-500",
          )}
        >
          {level < 2 ? (
            <BookOpen className="h-6 w-6" />
          ) : (
            <GraduationCap className="h-6 w-6" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-lg">{node.name}</h4>
            <Badge variant="outline" className="text-xs font-arabic">
              {node.title}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{node.specialty}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {node.year}
            </span>
            {node.location && <span>{node.location}</span>}
          </div>
        </div>

        {/* Expand button */}
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-4 space-y-4">
          {node.children!.map((child) => (
            <SanadTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AlumniSanadPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");

  // Fetch alumni with sanad from API
  const { data: alumniWithSanad = [], isLoading } = useAlumniWithSanad({
    search: searchQuery || undefined,
    graduationYear: filterYear !== "all" ? filterYear : undefined,
  });

  const filteredAlumni = alumniWithSanad.filter((alumni) => {
    const matchesSearch = searchQuery
      ? alumni.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesYear =
      filterYear === "all" || alumni.graduationYear.toString() === filterYear;
    return matchesSearch && matchesYear;
  });

  // Calculate stats from actual data
  const totalSanad = alumniWithSanad.reduce((sum, a) => sum + a.sanadCount, 0);
  const totalAlumni = alumniWithSanad.length;
  const verifiedCount = alumniWithSanad.filter(
    (a) => a.status === "verified",
  ).length;
  const totalJuz = alumniWithSanad.reduce((sum, a) => sum + a.juzCount, 0);

  return (
    <MainLayout allowedRoles={["SUPER_ADMIN", "UNIT_ADMIN", "TEACHER"]}>
      <div className="space-y-6">
        <PageHeader
          title="Sanad Alumni"
          description="Rantai sanad dan silsilah keilmuan alumni"
          actions={
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Pohon Sanad
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sanad</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{totalSanad}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Alumni Bersanad
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{totalAlumni}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hafizh 30 Juz</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {alumniWithSanad.filter((a) => a.juzCount >= 30).length}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <GitBranch className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jalur Sanad</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sanad Chain Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Pohon Sanad Al-Quran
            </CardTitle>
            <CardDescription>
              Silsilah ijazah dan sanad dari guru ke murid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SanadTreeNode node={mockSanadChain} />
          </CardContent>
        </Card>

        {/* Alumni List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Alumni Bersanad</CardTitle>
            <div className="flex gap-4 mt-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari alumni..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAlumni.map((alumni) => (
                <div
                  key={alumni.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{alumni.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Lulus {alumni.graduationYear} • {alumni.juzCount} Juz
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        alumni.status === "verified" ? "default" : "secondary"
                      }
                    >
                      {alumni.sanadCount} Sanad
                    </Badge>
                    <Button variant="outline" size="sm">
                      Lihat Sanad
                    </Button>
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
