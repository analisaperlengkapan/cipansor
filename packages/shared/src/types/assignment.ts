export enum AssignmentType {
  INDIVIDUAL = "INDIVIDUAL",
  GROUP = "GROUP",
}

export enum SubmissionStatus {
  SUBMITTED = "SUBMITTED",
  LATE = "LATE",
  GRADED = "GRADED",
  RETURNED = "RETURNED",
}

export type AssignmentAttachment = {
  url: string;
  name: string;
  type?: string;
  size?: number;
};

export type Assignment = {
  id: string;
  unitId: string;
  academicYearId: string;
  teacherId: string;
  subjectId: string;
  classId?: string | null;
  title: string;
  description?: string | null;
  type: AssignmentType;
  dueDate: Date | string;
  attachments?: AssignmentAttachment[] | any;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations (optional/partial)
  subject?: { name: string; code: string };
  class?: { name: string };
  teacher?: { user: { name: string } };
  _count?: { submissions: number };
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string | null;
  attachments?: AssignmentAttachment[] | any;
  submittedAt: Date | string;
  status: SubmissionStatus;
  grade?: number | null;
  feedback?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  student?: { name: string; photoUrl?: string };
};

export interface CreateAssignmentRequest {
  unitId: string;
  academicYearId: string;
  teacherId: string;
  subjectId: string;
  classId?: string;
  title: string;
  description?: string;
  type?: AssignmentType;
  dueDate: Date | string;
  attachments?: AssignmentAttachment[];
}

export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  type?: AssignmentType;
  dueDate?: Date | string;
  attachments?: AssignmentAttachment[];
}

export interface SubmitAssignmentRequest {
  studentId: string;
  content?: string;
  attachments?: AssignmentAttachment[];
}

export interface GradeSubmissionRequest {
  grade: number;
  feedback?: string;
}
