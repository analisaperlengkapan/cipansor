export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalUnits: number;
  studentsGrowth: number;
  attendanceRate: number;
  activeAcademicYear?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export interface AttendanceStats {
  date: string;
  present: number;
  absent: number;
  sick: number;
  excused: number;
}

export interface FinanceStats {
  totalBilled: number;
  totalPaid: number;
  totalUnpaid: number;
  recentPayments: {
    id: string;
    studentName: string;
    amount: number;
    date: string;
  }[];
}

export interface TahfidzStats {
  totalMemorized: number;
  averageJuz: number;
  topStudents: {
    id: string;
    name: string;
    totalJuz: number;
    totalAyat: number;
  }[];
  monthlyProgress: {
    month: string;
    totalAyat: number;
  }[];
}

export interface ViolationRewardStats {
  totalViolations: number;
  totalRewards: number;
  violationsByCategory: {
    category: string;
    count: number;
  }[];
  rewardsByCategory: {
    category: string;
    count: number;
  }[];
}
