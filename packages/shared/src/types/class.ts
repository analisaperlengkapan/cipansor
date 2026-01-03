export interface Class {
  id: string;
  name: string;
  grade: number; // Mapped from 'level' (string) -> number
  level: string; // The source of truth from DB
  capacity: number;
  academicYearId: string;
  academicYear?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  unitId: string;
  unit?: {
    id: string;
    name: string;
  };
  homeroomTeacherId?: string | null;
  homeroomTeacher?: {
    id: string;
    user: {
      id: string;
      name: string;
      email?: string;
    };
  } | null;
  _count?: {
    enrollments: number;
  };
  studentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClassInput {
  name: string;
  unitId: string;
  academicYearId: string;
  level: string;
  capacity: number;
  homeroomTeacherId?: string | null; // Allow null or undefined
}

export interface UpdateClassInput extends Partial<CreateClassInput> {}

export interface ClassEnrollment {
  id: string;
  studentId: string;
  classId: string;
  status: string; // 'active', etc.
  student?: {
    id: string;
    nis?: string | null;
    gender?: string | null; // e.g. 'MALE' | 'FEMALE'
    name?: string; // Derived/Fallback
    user?: {
      id: string;
      name: string;
    };
  };
  enrolledAt: Date;
}

export interface ClassEnrollmentInput {
  studentId: string;
}
