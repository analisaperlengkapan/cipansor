import { Student } from './models';

export type TahfidzActivityType = 'ZIYADAH' | 'MUROJAAH' | 'TASMI' | 'ASSESSMENT';

export type TahfidzGrade = 'MUMTAZ' | 'JAYYID_JIDDAN' | 'JAYYID' | 'MAQBUL' | 'RASIB';

export interface TahfidzRecord {
  id: string;
  studentId: string;
  activityType: TahfidzActivityType;
  surahNumber: number;
  surahName: string;
  ayahStart: number;
  ayahEnd: number;
  juz: number;
  totalAyah: number;
  score?: number | null;
  grade?: string | null; // For compatibility if needed, though not in schema
  notes?: string | null;
  recordedAt: string | Date;
  recordedById: string;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Relations
  student?: Student & {
    user?: {
      id: string;
      name: string;
    };
    unit?: {
      id: string;
      name: string;
    };
  };
  recordedBy?: {
    id: string;
    name: string;
  };
}

export interface TahfidzDashboardStats {
  totalRecords: number;
  totalStudents: number;
  recordsByType: {
    type: string;
    count: number;
  }[];
  recordsByGrade: {
    grade: string;
    count: number;
  }[];
  progressByJuz: {
    juz: number;
    studentCount: number;
    completedCount: number;
  }[];
  monthlyActivity: {
    month: string;
    setoran: number;
    murajaah: number;
    tasmi: number;
  }[];
  topStudents: {
    studentId: string;
    studentName: string;
    nis: string;
    totalAyah: number;
    completedJuz: number;
  }[];
  recentRecords: TahfidzRecord[];
}

export interface TahfidzStudentSummary {
  student: Student & {
    user?: { id: string; name: string };
    unit?: { id: string; name: string };
  };
  summary: {
    totalRecords: number;
    totalAyahMemorized: number;
    juzCoveredCount: number;
    surahCoveredCount: number;
    averageScore: number | null;
  };
  byActivity: {
    type: string;
    count: number;
    totalAyah: number;
  }[];
  juzCovered: number[];
  surahCovered: {
    surahNumber: number;
    surahName: string;
  }[];
  recentRecords: TahfidzRecord[];
}

export interface CreateTahfidzInput {
  studentId: string;
  activityType: TahfidzActivityType;
  surahNumber: number;
  surahName: string;
  ayahStart: number;
  ayahEnd: number;
  juz: number;
  totalAyah?: number;
  score?: number | null;
  notes?: string;
  recordedAt?: Date | string;
}

export interface UpdateTahfidzInput {
  activityType?: TahfidzActivityType;
  surahNumber?: number;
  surahName?: string;
  ayahStart?: number;
  ayahEnd?: number;
  juz?: number;
  totalAyah?: number;
  score?: number | null;
  notes?: string | null;
}

export interface GenerateCertificateInput {
  studentId: string;
  certificateType: string;
  issueDate?: Date | string;
  grade?: string;
  qiraahType?: string;
  musyrifName?: string;
  sanadChain?: string;
  notes?: string;
  completedJuz?: number[];
}

export interface DigitalCertificate {
  id: string;
  studentId: string;
  certificateType: string;
  certificateNumber: string;
  issueDate: string | Date;
  grade?: string | null;
  qrCode: string;
  verificationUrl: string;
  signatoryName: string;
  signatoryTitle: string;
  student?: Student;
}
