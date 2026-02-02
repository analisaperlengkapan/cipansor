// Reception / Front Office Module Types

export enum VisitStatus {
  PENDING = "PENDING",
  CHECKED_IN = "CHECKED_IN",
  CHECKED_OUT = "CHECKED_OUT",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PackageStatus {
  RECEIVED = "RECEIVED",
  NOTIFIED = "NOTIFIED",
  PICKED_UP = "PICKED_UP",
  DELIVERED = "DELIVERED",
  RETURNED = "RETURNED",
}

export interface GuestBook {
  id: string;
  unitId: string;
  name: string;
  institution?: string | null;
  purpose: string;
  phone?: string | null;
  checkIn: Date;
  checkOut?: Date | null;
  visitorCount: number;
  vehicleNumber?: string | null;
  receivedById: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  receivedBy?: {
    name: string;
  };
}

export interface StudentVisit {
  id: string;
  studentId: string;
  unitId: string;
  visitorName: string;
  relation: string;
  purpose: string;
  checkIn: Date;
  checkOut?: Date | null;
  status: VisitStatus | string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  student?: {
    name: string;
    nis: string;
    class?: {
      name: string;
    };
  };
}

export interface StudentPackage {
  id: string;
  studentId: string;
  unitId: string;
  senderName: string;
  senderPhone?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  receivedAt: Date;
  receivedById: string;
  status: PackageStatus | string;
  deliveredAt?: Date | null;
  deliveredTo?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  student?: {
    name: string;
    nis: string;
    class?: {
      name: string;
    };
  };
  receivedBy?: {
    name: string;
  };
}

// DTOs
export interface CreateGuestBookInput {
  name: string;
  institution?: string;
  purpose: string;
  phone?: string;
  visitorCount?: number;
  vehicleNumber?: string;
  notes?: string;
}

export interface UpdateGuestBookInput {
  checkOut?: Date;
  notes?: string;
}

export interface CreateStudentVisitInput {
  studentId: string;
  visitorName: string;
  relation: string;
  purpose: string;
  notes?: string;
}

export interface UpdateStudentVisitInput {
  checkOut?: Date;
  status?: VisitStatus | string;
  notes?: string;
}

export interface CreateStudentPackageInput {
  studentId: string;
  senderName: string;
  senderPhone?: string;
  description?: string;
  photoUrl?: string;
  notes?: string;
}

export interface UpdateStudentPackageInput {
  status?: PackageStatus | string;
  deliveredTo?: string;
  notes?: string;
}

export interface ReceptionStats {
  guestsToday: number;
  activeVisits: number;
  pendingPackages: number;
}
