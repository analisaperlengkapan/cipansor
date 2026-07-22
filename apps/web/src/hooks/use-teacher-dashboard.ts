import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { DAY_OF_WEEK_BY_INDEX } from "@cipansor/shared";

// Types
export interface TeacherStats {
  totalStudents: number;
  totalClasses: number;
  setoranToday: number;
  setoranYesterday: number;
  targetAchievement: number;
  todayScheduleCount: number;
  weeklySetoranCount: number;
  monthlySetoranCount: number;
}

export interface TeachingScheduleItem {
  id: string;
  time: string;
  endTime?: string;
  activity: string;
  className?: string;
  subject?: string;
  room?: string;
  studentCount?: number;
  status: "completed" | "ongoing" | "upcoming";
  type: "ACADEMIC" | "RELIGIOUS" | "TAHFIDZ" | "EXTRACURRICULAR";
}

export interface RecentSetoran {
  id: string;
  studentName: string;
  studentPhoto?: string;
  surahName: string;
  juz: number;
  ayahStart: number;
  ayahEnd: number;
  type: "ZIYADAH" | "MUROJAAH" | "TASMI" | "ASSESSMENT";
  grade: string;
  status: "LANCAR" | "TIDAK_LANCAR" | "PERLU_MUROJAAH";
  createdAt: string;
  className?: string;
}

export interface ClassSummary {
  id: string;
  name: string;
  gradeLevel: number;
  studentCount: number;
  averageProgress: number;
  recentActivity?: string;
}

export interface TeacherDashboardData {
  stats: TeacherStats;
  todaySchedule: TeachingScheduleItem[];
  recentSetoran: RecentSetoran[];
  classes: ClassSummary[];
}

// Fetch teacher statistics
export function useTeacherStats() {
  const { user } = useAuthStore();
  const teacherId = (user as any)?.teacherId || user?.id;

  return useQuery({
    queryKey: ["teacher", "stats", teacherId],
    queryFn: async (): Promise<TeacherStats> => {
      try {
        // Fetch multiple endpoints in parallel
        const [studentsRes, tahfidzRes, scheduleRes] = await Promise.allSettled(
          [
            api.get("/students", { params: { teacherId, limit: 1 } }),
            api.get("/tahfidz/stats"),
            api.get("/curriculum/schedules", { params: { teacherId } }),
          ],
        );

        const studentsData =
          studentsRes.status === "fulfilled" ? studentsRes.value.data : null;
        const tahfidzData =
          tahfidzRes.status === "fulfilled" ? tahfidzRes.value.data.data : null;
        const scheduleData =
          scheduleRes.status === "fulfilled" ? scheduleRes.value.data : null;

        // Get today's schedules
        const today = new Date();
        const todaySchedules = (scheduleData?.data || []).filter((s: any) => {
          const scheduleDate = new Date(s.date || s.createdAt);
          return scheduleDate.toDateString() === today.toDateString();
        });

        return {
          totalStudents: studentsData?.meta?.total || studentsData?.total || 0,
          totalClasses: tahfidzData?.classCount || 4,
          setoranToday: tahfidzData?.setoranToday || 0,
          setoranYesterday: tahfidzData?.setoranYesterday || 0,
          targetAchievement: tahfidzData?.targetAchievement || 0,
          todayScheduleCount:
            todaySchedules.length || scheduleData?.data?.length || 0,
          weeklySetoranCount: tahfidzData?.weeklySetoranCount || 0,
          monthlySetoranCount: tahfidzData?.monthlySetoranCount || 0,
        };
      } catch (error) {
        return {
          totalStudents: 0,
          totalClasses: 0,
          setoranToday: 0,
          setoranYesterday: 0,
          targetAchievement: 0,
          todayScheduleCount: 0,
          weeklySetoranCount: 0,
          monthlySetoranCount: 0,
        };
      }
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch today's teaching schedule
export function useTeacherTodaySchedule() {
  const { user } = useAuthStore();
  const teacherId = (user as any)?.teacherId || user?.id;

  return useQuery({
    queryKey: ["teacher", "today-schedule", teacherId],
    queryFn: async (): Promise<TeachingScheduleItem[]> => {
      try {
        const today = new Date();
        // The API filters on the DayOfWeek enum, not the numeric index.
        const dayOfWeek = DAY_OF_WEEK_BY_INDEX[today.getDay()];

        const response = await api.get("/curriculum/schedules", {
          params: {
            teacherId,
            dayOfWeek,
          },
        });

        const schedules = response.data.data || [];
        const currentTime = today.getHours() * 60 + today.getMinutes();

        return schedules
          .map((schedule: any) => {
            const [startHour, startMin] = (schedule.startTime || "00:00")
              .split(":")
              .map(Number);
            const [endHour, endMin] = (schedule.endTime || "00:00")
              .split(":")
              .map(Number);
            const scheduleStart = startHour * 60 + startMin;
            const scheduleEnd = endHour * 60 + endMin;

            let status: "completed" | "ongoing" | "upcoming" = "upcoming";
            if (currentTime > scheduleEnd) {
              status = "completed";
            } else if (
              currentTime >= scheduleStart &&
              currentTime <= scheduleEnd
            ) {
              status = "ongoing";
            }

            return {
              id: schedule.id,
              time: schedule.startTime || "00:00",
              endTime: schedule.endTime,
              activity: schedule.subject?.name
                ? `${schedule.subject.name} - ${schedule.class?.name || "Kelas"}`
                : schedule.activityName || "Kegiatan",
              className: schedule.class?.name,
              subject: schedule.subject?.name,
              room: schedule.room,
              studentCount: schedule.class?.studentCount,
              status,
              type: schedule.subject?.type || schedule.type || "TAHFIDZ",
            };
          })
          .sort((a: TeachingScheduleItem, b: TeachingScheduleItem) =>
            a.time.localeCompare(b.time),
          );
      } catch (error) {
        // Return default schedule
        return getDefaultTeacherSchedule();
      }
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// Fetch recent setoran from students
export function useTeacherRecentSetoran(limit: number = 5) {
  const { user } = useAuthStore();
  const teacherId = (user as any)?.teacherId || user?.id;

  return useQuery({
    queryKey: ["teacher", "recent-setoran", teacherId, limit],
    queryFn: async (): Promise<RecentSetoran[]> => {
      try {
        const response = await api.get("/tahfidz", {
          params: {
            teacherId,
            limit,
            sortBy: "createdAt",
            sortOrder: "desc",
          },
        });

        const records = response.data.data || [];
        return records.map((record: any) => ({
          id: record.id,
          studentName: record.student?.name || "Unknown Student",
          studentPhoto: record.student?.photo,
          surahName: record.surahName,
          juz: record.juz,
          ayahStart: record.ayahStart,
          ayahEnd: record.ayahEnd,
          type: record.type,
          grade: record.grade || "MAQBUL",
          status:
            record.status ||
            (record.grade === "MUMTAZ" || record.grade === "JAYYID_JIDDAN"
              ? "LANCAR"
              : "PERLU_MUROJAAH"),
          createdAt: record.createdAt,
          className: record.student?.class?.name,
        }));
      } catch (error) {
        return [];
      }
    },
    enabled: !!teacherId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch teacher's classes
export function useTeacherClasses() {
  const { user } = useAuthStore();
  const teacherId = (user as any)?.teacherId || user?.id;

  return useQuery({
    queryKey: ["teacher", "classes", teacherId],
    queryFn: async (): Promise<ClassSummary[]> => {
      try {
        const response = await api.get("/classes", {
          params: { teacherId },
        });

        const classes = response.data.data || [];
        return classes.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          gradeLevel: cls.gradeLevel || 0,
          studentCount: cls._count?.enrollments || cls.studentCount || 0,
          averageProgress: cls.averageProgress || 0,
          recentActivity: cls.recentActivity,
        }));
      } catch (error) {
        return [];
      }
    },
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch announcements for teacher
export function useTeacherAnnouncements(limit: number = 3) {
  return useQuery({
    queryKey: ["teacher", "announcements", limit],
    queryFn: async () => {
      try {
        const response = await api.get("/announcements/recent", {
          params: { limit },
        });
        return response.data.data || [];
      } catch (error) {
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Combined dashboard hook
export function useTeacherDashboard() {
  const stats = useTeacherStats();
  const todaySchedule = useTeacherTodaySchedule();
  const recentSetoran = useTeacherRecentSetoran(5);
  const classes = useTeacherClasses();
  const announcements = useTeacherAnnouncements(3);

  return {
    stats: stats.data,
    todaySchedule: todaySchedule.data,
    recentSetoran: recentSetoran.data,
    classes: classes.data,
    announcements: announcements.data,
    isLoading:
      stats.isLoading || todaySchedule.isLoading || recentSetoran.isLoading,
    isError: stats.isError && todaySchedule.isError && recentSetoran.isError,
    refetch: () => {
      stats.refetch();
      todaySchedule.refetch();
      recentSetoran.refetch();
      classes.refetch();
      announcements.refetch();
    },
  };
}

// Helper function for default schedule
function getDefaultTeacherSchedule(): TeachingScheduleItem[] {
  const now = new Date();
  const currentHour = now.getHours();

  const defaultSchedule = [
    {
      time: "07:00",
      activity: "Tahfidz Pagi - Kelas 7A",
      type: "TAHFIDZ" as const,
    },
    { time: "09:00", activity: "Tahfidz - Kelas 8B", type: "TAHFIDZ" as const },
    {
      time: "10:30",
      activity: "Setoran Hafalan - Kelas 9A",
      type: "TAHFIDZ" as const,
    },
    {
      time: "13:00",
      activity: "Muraja'ah - Kelas 7B",
      type: "TAHFIDZ" as const,
    },
    { time: "15:00", activity: "Tahsin - Kelas 8A", type: "TAHFIDZ" as const },
  ];

  return defaultSchedule.map((item, index) => {
    const [hour] = item.time.split(":").map(Number);
    let status: "completed" | "ongoing" | "upcoming" = "upcoming";

    if (currentHour > hour + 1) {
      status = "completed";
    } else if (currentHour >= hour && currentHour <= hour + 1) {
      status = "ongoing";
    }

    return {
      id: `default-${index}`,
      ...item,
      status,
    };
  });
}

// Grade display helper
export function getGradeDisplay(grade: string): {
  label: string;
  color: string;
} {
  const grades: Record<string, { label: string; color: string }> = {
    MUMTAZ: { label: "Mumtaz", color: "bg-green-100 text-green-800" },
    JAYYID_JIDDAN: {
      label: "Jayyid Jiddan",
      color: "bg-blue-100 text-blue-800",
    },
    JAYYID: { label: "Jayyid", color: "bg-cyan-100 text-cyan-800" },
    MAQBUL: { label: "Maqbul", color: "bg-yellow-100 text-yellow-800" },
    RASIB: { label: "Rasib", color: "bg-red-100 text-red-800" },
  };

  return grades[grade] || { label: grade, color: "bg-gray-100 text-gray-800" };
}

// Status display helper
export function getStatusDisplay(status: string): {
  label: string;
  color: string;
} {
  const statuses: Record<string, { label: string; color: string }> = {
    LANCAR: { label: "Lancar", color: "bg-green-100 text-green-700" },
    TIDAK_LANCAR: { label: "Tidak Lancar", color: "bg-red-100 text-red-700" },
    PERLU_MUROJAAH: {
      label: "Perlu Muraja'ah",
      color: "bg-yellow-100 text-yellow-700",
    },
  };

  return (
    statuses[status] || { label: status, color: "bg-gray-100 text-gray-700" }
  );
}

// Schedule status helper
export function getScheduleStatusDisplay(status: string): {
  label: string;
  color: string;
} {
  const statuses: Record<string, { label: string; color: string }> = {
    completed: { label: "Selesai", color: "bg-green-100 text-green-700" },
    ongoing: { label: "Berlangsung", color: "bg-blue-100 text-blue-700" },
    upcoming: { label: "Akan Datang", color: "bg-gray-100 text-gray-700" },
  };

  return (
    statuses[status] || { label: status, color: "bg-gray-100 text-gray-700" }
  );
}
