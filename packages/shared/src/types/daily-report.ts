
export type DailyMood = 'HAPPY' | 'NEUTRAL' | 'SAD' | 'TIRED' | 'EXCITED' | 'SICK';

export type MealConsumption = 'HABIS' | 'SETENGAH' | 'SEDIKIT' | 'TIDAK_MAU';

export interface DailyReportPhoto {
  id: string;
  dailyReportId: string;
  photoUrl: string;
  caption?: string;
  activityType?: string;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  studentId: string;
  unitId: string;
  academicYearId?: string;
  reportDate: string;
  unitType: 'PESANTREN' | 'TK_QURAN' | 'SD_IT' | 'SMP_IT' | 'SMA_QURAN' | 'OTHER';
  arrivalTime?: string;
  mood?: DailyMood;
  healthStatus?: string;
  temperature?: number;
  hadBreakfast?: boolean;
  mealStatus?: MealConsumption;
  snackStatus?: MealConsumption;
  napDuration?: number;
  toiletNotes?: string;
  sholatDhuha?: boolean;
  tahfidzActivity?: string;
  activitiesSummary?: string;
  achievements?: string;
  behaviorNotes?: string;
  teacherNotes?: string;
  homeActivity?: string;
  departureTime?: string;
  pickedUpBy?: string;
  parentReadAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    nis: string;
    photoUrl?: string;
    user?: {
      name: string;
    };
    classId?: string;
  };
  unit?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  photos?: DailyReportPhoto[];
}
