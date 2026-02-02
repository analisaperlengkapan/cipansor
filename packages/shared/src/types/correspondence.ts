// Letter Enums
export enum LetterDirection {
  INCOMING = "INCOMING",
  OUTGOING = "OUTGOING",
}

export enum LetterUrgency {
  NORMAL = "NORMAL",
  IMMEDIATE = "IMMEDIATE",
  URGENT = "URGENT",
}

export enum LetterNature {
  PUBLIC = "PUBLIC",
  CONFIDENTIAL = "CONFIDENTIAL",
  STRICTLY_CONFIDENTIAL = "STRICTLY_CONFIDENTIAL",
}

export enum LetterStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  REVISION_NEEDED = "REVISION_NEEDED",
  READY_TO_SIGN = "READY_TO_SIGN",
  SIGNED = "SIGNED",
  SENT = "SENT",
  ARCHIVED = "ARCHIVED",
  DISPOSED = "DISPOSED",
}

// Letter DTOs
export interface CreateLetterInput {
  unitId: string;
  direction: LetterDirection;
  classificationId?: string;
  agendaNumber?: string;
  letterNumber?: string;
  date: string; // ISO Date
  receivedAt?: string; // ISO Date
  subject: string;
  content?: string;
  fileUrl?: string;
  urgency: LetterUrgency;
  nature: LetterNature;
  status: LetterStatus;
  senderName?: string;
  senderTitle?: string;
  senderInstance?: string;
  recipientName?: string;
  recipientInstance?: string;

  // Relations
  reviewerIds?: string[]; // Ordered list of reviewers (User IDs)
  recipientIds?: string[]; // Internal recipients (User IDs)
  ccIds?: string[]; // CC recipients (User IDs)
}

export interface UpdateLetterInput extends Partial<CreateLetterInput> {
  reviewerNotes?: string; // For adding notes during review
}

export interface LetterReviewerDetail {
  id: string;
  reviewerId: string;
  reviewerName: string;
  order: number;
  status: string;
  isSigner: boolean;
  notes?: string;
  reviewedAt?: string;
  reviewer?: {
    name: string;
    teacher?: { nip: string | null };
    staff?: { nip: string | null };
  };
}

export interface LetterDispositionDetail {
  id: string;
  senderName: string;
  recipientName: string;
  recipientId: string;
  instruction: string;
  status: string;
  deadline?: string;
  createdAt: string;
}

export interface LetterDetail {
  id: string;
  unitId: string;
  unit?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
  };
  direction: LetterDirection;
  classificationId?: string;
  classification?: {
    code: string;
    name: string;
  };
  classificationCode?: string;
  classificationName?: string;
  agendaNumber?: string;
  letterNumber?: string;
  date: string;
  receivedAt?: string;
  subject: string;
  content?: string;
  fileUrl?: string;
  urgency: LetterUrgency;
  nature: LetterNature;
  status: LetterStatus;
  senderName?: string;
  senderTitle?: string;
  senderInstance?: string;
  recipientName?: string;
  recipientInstance?: string;
  createdByName: string;
  createdAt: string;

  reviewers: LetterReviewerDetail[];
  dispositions: LetterDispositionDetail[];
}

// Disposition DTOs
export interface CreateDispositionInput {
  letterId: string;
  senderId: string;
  recipientId: string;
  instruction: string;
  deadline?: string;
  parentDispositionId?: string;
  notes?: string;
}

export interface UpdateDispositionInput {
  status?: string;
  notes?: string;
  completedAt?: string;
}

// Agenda Number Config
export interface AgendaNumberConfig {
  id: string;
  unitId: string;
  type: string;
  lastNumber: number;
  format: string;
  resetPeriod: string;
}
