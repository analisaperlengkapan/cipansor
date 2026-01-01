import { Student } from './models';

export type TahfidzActivityType = 'ZIYADAH' | 'MUROJAAH' | 'TASMI' | 'ASSESSMENT';

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
