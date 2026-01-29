"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAssessments, ASSESSMENT_TYPE_LABELS, ExamType, type AssessmentType } from "@/hooks";
import Link from "next/link";

interface ExamCalendarProps {
  classId?: string;
  subjectId?: string;
  type?: AssessmentType | "ALL";
}

export function ExamCalendar({ classId, subjectId, type }: ExamCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

  const { data: assessments, isLoading } = useAssessments({
    classId: classId === "ALL" ? undefined : classId,
    subjectId: subjectId === "ALL" ? undefined : subjectId,
    type: type === "ALL" ? undefined : type,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    limit: 100, // Ensure we get enough for the view
  });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getAssessmentTypeColor = (type: AssessmentType) => {
     const colors: Record<AssessmentType, string> = {
      [ExamType.DAILY_TEST]: "bg-gray-100 text-gray-800 border-gray-200",
      [ExamType.MIDTERM]: "bg-purple-100 text-purple-800 border-purple-200",
      [ExamType.FINAL]: "bg-red-100 text-red-800 border-red-200",
      [ExamType.PRACTICAL]: "bg-green-100 text-green-800 border-green-200",
      [ExamType.PROJECT]: "bg-yellow-100 text-yellow-800 border-yellow-200",
      [ExamType.QUIZ]: "bg-pink-100 text-pink-800 border-pink-200",
      [ExamType.TAHFIDZ_TEST]: "bg-teal-100 text-teal-800 border-teal-200",
    };
    return colors[type] || "bg-gray-100";
  };

  return (
    <Card className="h-full flex flex-col shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl capitalize">
            {format(currentDate, "MMMM yyyy", { locale: id })}
          </CardTitle>
          <div className="flex items-center border rounded-md bg-background shadow-sm">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday} className="h-8 px-2 font-normal">
              Hari Ini
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="grid grid-cols-7 border-b text-center text-sm font-medium text-muted-foreground bg-muted/40 py-2">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-5 md:grid-rows-6 h-[600px] md:h-[700px] bg-background">
          {calendarDays.map((day, idx) => {
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            const daysAssessments = assessments?.filter(a =>
              isSameDay(new Date(a.scheduledAt), day)
            );

            return (
              <div
                key={day.toISOString()}
                className={`
                  border-b border-r p-1 md:p-2 flex flex-col gap-1 transition-colors hover:bg-muted/20
                  ${!isCurrentMonth ? "bg-muted/10 text-muted-foreground" : ""}
                  ${isToday ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}
                  ${idx % 7 === 0 ? "border-l" : ""}
                `}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`
                      text-xs md:text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full
                      ${isToday ? "bg-primary text-primary-foreground shadow-sm" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px] md:max-h-[100px] no-scrollbar">
                  {daysAssessments?.map((assessment) => (
                    <Popover key={assessment.id}>
                      <PopoverTrigger asChild>
                        <div
                          className={`
                            text-[10px] md:text-xs p-1 rounded border truncate cursor-pointer shadow-sm hover:opacity-80 transition-opacity
                            ${getAssessmentTypeColor(assessment.type)}
                          `}
                        >
                          <span className="font-semibold block truncate">
                            {assessment.subject?.name}
                          </span>
                          <span className="opacity-80 hidden md:block truncate text-[10px]">
                            {assessment.class?.name}
                          </span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 z-50 p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-semibold leading-tight">
                              <Link href={`/assessment/${assessment.id}`} className="hover:underline">
                                {assessment.title}
                              </Link>
                            </h4>
                            <Badge variant="outline" className="whitespace-nowrap">{ASSESSMENT_TYPE_LABELS[assessment.type]}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground border-b pb-2">
                            {format(new Date(assessment.scheduledAt), "EEEE, d MMMM yyyy, HH:mm", { locale: id })}
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            <div>
                              <span className="text-muted-foreground block mb-0.5">Kelas:</span>
                              <p className="font-medium">{assessment.class?.name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground block mb-0.5">Mapel:</span>
                              <p className="font-medium">{assessment.subject?.name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground block mb-0.5">Guru:</span>
                              <p className="font-medium">{assessment.teacher?.user?.name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground block mb-0.5">Status:</span>
                              <p className="font-medium capitalize">{assessment.status === 'DRAFT' ? 'Draft' : 'Dipublikasikan'}</p>
                            </div>
                          </div>
                          <Button size="sm" className="w-full mt-2" asChild>
                            <Link href={`/assessment/${assessment.id}`}>Lihat Detail</Link>
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
