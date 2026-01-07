// Reception / Front Office Module Types

export enum VisitStatus {
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED'
}

export enum PackageStatus {
  RECEIVED = 'RECEIVED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED'
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
  purpose?: string | null;
  checkIn: Date;
  checkOut?: Date | null;
  status: VisitStatus;
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
  status: PackageStatus;
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
  purpose?: string;
  notes?: string;
}

export interface UpdateStudentVisitInput {
  checkOut?: Date;
  status?: VisitStatus;
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
  status?: PackageStatus;
  deliveredTo?: string;
  notes?: string;
}

export interface ReceptionStats {
  guestsToday: number;
  activeVisits: number;
  pendingPackages: number;
}
