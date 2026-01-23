export enum QualityStandardType {
  STANDAR_ISI = "STANDAR_ISI",
  STANDAR_PROSES = "STANDAR_PROSES",
  STANDAR_KOMPETENSI_LULUSAN = "STANDAR_KOMPETENSI_LULUSAN",
  STANDAR_PENDIDIK_DAN_TENAGA_KEPENDIDIKAN = "STANDAR_PENDIDIK_DAN_TENAGA_KEPENDIDIKAN",
  STANDAR_SARANA_DAN_PRASARANA = "STANDAR_SARANA_DAN_PRASARANA",
  STANDAR_PENGELOLAAN = "STANDAR_PENGELOLAAN",
  STANDAR_PEMBIAYAAN = "STANDAR_PEMBIAYAAN",
  STANDAR_PENILAIAN_PENDIDIKAN = "STANDAR_PENILAIAN_PENDIDIKAN",
}

export enum AuditStatus {
  PLANNED = "PLANNED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CLOSED = "CLOSED",
}

export interface QualityStandard {
  id: string;
  type: QualityStandardType;
  name: string;
  description?: string | null;
  indicators: QualityIndicator[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QualityIndicator {
  id: string;
  standardId: string;
  code: string;
  name: string;
  description?: string | null;
  targetScore: number;
  isActive: boolean;
  sortOrder: number;
  evidences?: QualityEvidence[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QualityEvidence {
  id: string;
  unitId: string;
  indicatorId: string;
  academicYearId: string;
  name: string;
  fileUrl: string;
  description?: string | null;
  uploadedById: string;
  uploadedBy?: {
    id: string;
    name: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateQualityEvidenceInput {
  unitId: string;
  indicatorId: string;
  academicYearId: string;
  name: string;
  fileUrl: string;
  description?: string;
}

export interface QualityAudit {
  id: string;
  unitId: string;
  academicYearId: string;
  code: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  status: AuditStatus;
  leadAuditorId?: string | null;
  notes?: string | null;
  items?: QualityAuditItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QualityAuditItem {
  id: string;
  auditId: string;
  indicatorId: string;
  score?: number | null;
  notes?: string | null;
  auditorId?: string | null;
  indicator?: QualityIndicator;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QualityDashboardSummary {
  id: string;
  standardType: QualityStandardType;
  standardName: string;
  totalIndicators: number;
  uploadedEvidenceCount: number;
  compliancePercentage: number;
}
