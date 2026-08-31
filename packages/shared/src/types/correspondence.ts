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

/**
 * Jenis naskah dinas — apa dokumennya, bukan seberapa rahasia.
 *
 * Sifat (LetterNature) yang boleh menyertai tiap jenis diatur di
 * apps/api/src/utils/letter-naskah.ts; aturannya ditegakkan di server, dan
 * formulir web membaca daftar yang sama agar pilihan yang ditawarkan sama
 * dengan pilihan yang diterima.
 */
export enum LetterType {
  SURAT_DINAS = "SURAT_DINAS",
  NOTA_DINAS = "NOTA_DINAS",
  SURAT_KEPUTUSAN = "SURAT_KEPUTUSAN",
  SURAT_TUGAS = "SURAT_TUGAS",
  SURAT_EDARAN = "SURAT_EDARAN",
  SURAT_UNDANGAN = "SURAT_UNDANGAN",
  SURAT_KETERANGAN = "SURAT_KETERANGAN",
  BERITA_ACARA = "BERITA_ACARA",
  PENGUMUMAN = "PENGUMUMAN",
}

/** Derajat kerahasiaan. LIMITED (Terbatas) sebelumnya tidak ada. */
export enum LetterNature {
  PUBLIC = "PUBLIC",
  LIMITED = "LIMITED",
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
  /** Jenis naskah. Tidak diisi = SURAT_DINAS, seperti perilaku sebelumnya. */
  type?: LetterType;
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

/** One append-only entry from a letter's flow history (LetterFlowEvent). */
export interface LetterFlowEventDetail {
  id: string;
  action: string;
  actorId: string;
  actor?: { name: string };
  target?: { name: string } | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface LetterDetail {
  id: string;
  unitId: string;
  type?: LetterType;
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
  flowEvents?: LetterFlowEventDetail[];
  signatures?: LetterSignatureDetail[];
}

/**
 * The electronic signature affixed to a signed letter.
 *
 * Deliberately no `signature` or `digest` field: the naskah only needs to
 * carry the QR, and the proof itself is checked server-side by
 * `GET /esign/verify/:token`. Shipping the raw signature to every reader of
 * the letter would put the cryptographic material on more screens than the
 * verification actually requires.
 */
export interface LetterSignatureDetail {
  id: string;
  signedAt: string;
  /** Goes into the QR as `/verifikasi/{token}` — a capability, not a secret. */
  verificationToken: string;
  algorithm: string;
  /** Set when the signature was revoked; the naskah must then not claim valid. */
  revokedAt?: string | null;
  signer: {
    name: string;
    nip?: string;
  };
}

// Disposition DTOs
export interface CreateDispositionInput {
  letterId: string;
  senderId: string;
  recipientId?: string;
  recipientIds?: string[];
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

// Public Verification DTO
export interface PublicLetterVerificationResult {
  isValid: boolean;
  isRevoked?: boolean;
  revokedAt?: string | Date | null;
  signedAt?: string | Date;
  algorithm?: string;
  digest?: string;
  signer?: {
    name: string;
    nip: string;
    position: string;
  };
  letter?: {
    letterNumber: string;
    subject: string | null;
    date: string | Date;
    status: string;
    unitName: string;
  };
  reason?: string;
}
