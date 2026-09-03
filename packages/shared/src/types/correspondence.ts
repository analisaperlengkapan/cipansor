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

/**
 * Cara sebuah naskah keluar dari kantor.
 *
 * Dicatat karena buku ekspedisi mencatatnya: ketika penerima menyatakan tidak
 * menerima surat, "lewat apa dan kepada siapa diserahkan" adalah pertanyaan
 * pertama, dan status SENT saja tidak menjawabnya.
 */
export enum LetterDispatchChannel {
  HAND_DELIVERY = "HAND_DELIVERY",
  COURIER = "COURIER",
  POST = "POST",
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  OTHER = "OTHER",
}

export const LETTER_DISPATCH_CHANNEL_LABELS: Record<
  LetterDispatchChannel,
  string
> = {
  [LetterDispatchChannel.HAND_DELIVERY]: "Diantar langsung",
  [LetterDispatchChannel.COURIER]: "Kurir / ekspedisi",
  [LetterDispatchChannel.POST]: "Pos",
  [LetterDispatchChannel.EMAIL]: "Surel",
  [LetterDispatchChannel.WHATSAPP]: "WhatsApp",
  [LetterDispatchChannel.OTHER]: "Lainnya",
};

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
  /**
   * Tembusan — penerima salinan, bukan penerima surat.
   *
   * Sudah lama ada di sini dan di kolom `LetterRecipient.isCC`, dan selama itu
   * pula tidak pernah terpakai: satu-satunya penulisan `isCC` di seluruh kode
   * adalah `isCC: false` yang dipaku pada pembuatan surat. Tembusan adalah
   * unsur baku naskah dinas; tanpa ini penyusun terpaksa menuliskannya di
   * badan surat, di mana ia tidak terbaca oleh apa pun.
   */
  ccIds?: string[]; // CC recipients (User IDs)
  /** Lampiran yang menyertai naskah, sudah diunggah lewat POST /upload. */
  attachments?: LetterAttachmentInput[];
}

export interface LetterAttachmentInput {
  name: string;
  fileUrl: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface UpdateLetterInput extends Partial<CreateLetterInput> {
  reviewerNotes?: string; // For adding notes during review
}

/**
 * One rung of a letter's verification ladder.
 *
 * The name lives on the nested `reviewer`, which is what the API sends. A flat
 * `reviewerName: string` was declared here too and no endpoint has ever
 * populated it — so the letter page's "Status Review" card printed an empty
 * name beside every rung, and the panel that exists to say *who* is holding the
 * letter up said only "Pending".
 *
 * Same defect as `LetterDispositionDetail` had, and the same lesson: a DTO
 * field that no response fills is not documentation, it is a silent bug with a
 * type annotation on it.
 */
export interface LetterReviewerDetail {
  id: string;
  reviewerId: string;
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

/**
 * One disposition hop on a letter.
 *
 * `sender` and `recipient` are nested objects, matching what the API actually
 * sends (`include: { sender: { select: { name } } }`). They used to be declared
 * here as flat `senderName` / `recipientName` strings — fields the API has
 * never sent. TypeScript was satisfied, `disposition.senderName[0]` read
 * `undefined[0]` at runtime, and the whole letter page crashed for every letter
 * that had ever been disposed. A DTO that describes a response nobody sends is
 * worse than no DTO: it converts a visible mistake into a silent one.
 */
export interface LetterDispositionDetail {
  id: string;
  senderId?: string;
  sender?: { name: string } | null;
  recipientId: string;
  recipient?: { name: string } | null;
  instruction: string;
  status: string;
  deadline?: string | null;
  notes?: string | null;
  completedAt?: string | null;
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

/** Satu lampiran naskah, sebagaimana dikirim API. */
export interface LetterAttachmentDetail {
  id: string;
  name: string;
  fileUrl: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  order: number;
  createdAt: string;
}

/**
 * Penerima internal sebuah surat — termasuk penerima tembusan.
 *
 * `isCC` membedakan keduanya, dan itu satu-satunya alasan bentuk ini ada:
 * daftar penerima dan daftar tembusan adalah dua daftar yang dicetak di dua
 * tempat berbeda pada naskah.
 */
export interface LetterRecipientDetail {
  id: string;
  userId?: string | null;
  unitId?: string | null;
  isCC: boolean;
  readAt?: string | null;
  user?: { name: string } | null;
  unit?: { name: string } | null;
}

/** Satu baris buku ekspedisi: kapan naskah keluar, lewat apa, dan buktinya. */
export interface LetterDispatchDetail {
  id: string;
  dispatchedAt: string;
  channel: LetterDispatchChannel;
  receivedByName?: string | null;
  trackingNumber?: string | null;
  receiptUrl?: string | null;
  note?: string | null;
  dispatchedBy?: { name: string } | null;
  createdAt: string;
}

/** Apa yang dicatat petugas ketika sebuah naskah benar-benar dikirim. */
export interface DispatchLetterInput {
  channel: LetterDispatchChannel;
  /** Tidak diisi = sekarang. Tidak boleh di masa depan. */
  dispatchedAt?: string;
  receivedByName?: string;
  trackingNumber?: string;
  receiptUrl?: string;
  note?: string;
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
  createdById?: string;
  createdBy?: { name: string };
  createdByName: string;
  createdAt: string;
  /** Kapan naskah pertama kali keluar dari kantor; null selama belum dikirim. */
  sentAt?: string | null;

  reviewers: LetterReviewerDetail[];
  recipients?: LetterRecipientDetail[];
  attachments?: LetterAttachmentDetail[];
  dispatches?: LetterDispatchDetail[];
  dispositions: LetterDispositionDetail[];
  flowEvents?: LetterFlowEventDetail[];
  signatures?: LetterSignatureDetail[];
  revocationRequests?: LetterRevocationRequestDetail[];
}

/**
 * The electronic signature affixed to a signed letter.
 *
 * Deliberately no `signature` or `digest` field: the naskah only needs to
 * carry the QR, and the proof itself is checked server-side against the
 * uploaded PDF's bytes. Shipping the raw signature to every reader of the
 * letter would put the cryptographic material on more screens than the
 * verification actually requires.
 */
export interface LetterSignatureDetail {
  id: string;
  signedAt: string;
  /**
   * The raw token printed into the QR — not a URL.
   *
   * Scanning it opens nothing, deliberately: a token attests that some letter
   * was signed, never that the document in your hand is that letter, so
   * verification takes an uploaded PDF instead.
   */
  verificationToken: string;
  algorithm: string;
  /**
   * Jabatan penandatangan saat menandatangani.
   *
   * Kewenangan mencabut diukur terhadap jabatan ini
   * (`letter-revocation-authority.ts`), bukan terhadap jabatan orang itu hari
   * ini — sebuah SK yang ditandatangani Ketua tetap naskah Ketua walaupun
   * penandatangannya kemudian menjabat yang lain.
   */
  signerRoleCode?: string | null;
  /** Set when the signature was revoked; the naskah must then not claim valid. */
  revokedAt?: string | null;
  /** Shown to anyone who can read the letter, and on the public page. */
  revokedReason?: string | null;
  revokedBy?: { name: string } | null;
  revokedByRoleCode?: string | null;
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

/**
 * Permohonan pencabutan naskah dinas.
 *
 * Mengajukan dan memutuskan adalah dua perbuatan yang berbeda, oleh dua pihak
 * yang berbeda — bentuk yang sama dengan pencabutan sertifikat pada RFC 5280.
 */
export interface LetterRevocationRequestDetail {
  id: string;
  letterId: string;
  signatureId: string;
  requesterId: string;
  requester?: { id: string; name: string; email: string } | null;
  reason: string;
  attachmentUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  decidedById?: string | null;
  decidedBy?: { name: string } | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  createdAt: string;
  letter?: {
    id: string;
    letterNumber?: string | null;
    subject: string;
    date: string;
  } | null;
  signature?: {
    id: string;
    signerId: string;
    signerRoleCode?: string | null;
    revokedAt?: string | null;
    signer?: { name: string } | null;
  } | null;
}

// Public Verification DTO
export interface PublicLetterVerificationResult {
  isValid: boolean;
  isRevoked?: boolean;
  revokedAt?: string | Date | null;
  /**
   * Why it was withdrawn, in the revoker's own words.
   *
   * Public text: it is shown as written to anyone who uploads the document.
   * Without it the page can only say "dicabut" and leave the reader to guess
   * whether the letter was wrong, superseded, or issued to the wrong person.
   */
  revokedReason?: string | null;
  /** Pejabat yang mencabutnya. */
  revokedByName?: string | null;
  /**
   * Benarkah pencabutan ini dinyatakan oleh pejabat yang namanya tercantum?
   *
   * `true` bila tanda tangan Ed25519 atas pernyataan pencabutannya sah — sama
   * seperti CRL yang ditandatangani penerbitnya (RFC 5280). `null` untuk
   * pencabutan yang tercatat sebelum tanda tangan pencabutan diberlakukan:
   * bukan kegagalan verifikasi, hanya ketiadaan bukti tambahan.
   */
  revocationVerified?: boolean | null;
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

export interface ListParticipantsQuery {
  search?: string;
  unitId?: string;
  limit?: number;
}

export interface CorrespondenceParticipant {
  id: string;
  name: string;
  email: string;
  unitId?: string | null;
  unitName?: string | null;
  roleCode?: string | null;
  nip?: string | null;
  position?: string | null;
}

export type CreateDispositionResponse =
  | LetterDispositionDetail
  | LetterDispositionDetail[];
