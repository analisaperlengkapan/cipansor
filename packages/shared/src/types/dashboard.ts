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
    id?: string;
    studentId?: string;
    name?: string;
    studentName?: string;
    unitName?: string;
    totalJuz?: number;
    juzCount?: number;
    totalAyat?: number;
    totalAyah?: number;
    surahCount?: number;
  }[];
  monthlyProgress: {
    month: string;
    totalAyat?: number;
    ayahCount?: number;
    studentCount?: number;
  }[];
}

export interface ViolationRewardStats {
  totalViolations: number;
  totalRewards: number;
  violationsByCategory?: {
    category: string;
    count: number;
  }[];
  rewardsByCategory?: {
    category: string;
    count: number;
  }[];
  recentViolations?: {
    id: string;
    studentName: string;
    type: string;
    points: number;
    date: string;
  }[];
  recentRewards?: {
    id: string;
    studentName: string;
    type: string;
    points: number;
    date: string;
  }[];
}

// Added for metrics history
export interface DashboardMetrics {
  students: {
    total: number;
    active: number;
    change: number;
  };
  teachers: {
    total: number;
  };
  attendance: {
    rate: number;
    present: number;
    total: number;
  };
  tahfidz: {
    totalHafidz: number;
    avgQuality: number;
  };
  timestamp: string;
}

export interface DashboardAlert {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  unitId?: string;
  unitName?: string;
}

export interface DashboardMetricsResponse {
  current: DashboardMetrics;
  recent: DashboardMetrics[];
  alerts: DashboardAlert[];
}

// ============================================
// Enhanced Dashboard Types
// ============================================

export interface DashboardOverview {
  students: {
    total: number;
    active: number;
    inactive: number;
  };
  teachers: {
    total: number;
  };
  classes: {
    total: number;
  };
  units: {
    total: number;
  };
  attendance: {
    rate: number;
    total: number;
    present: number;
  };
  tahfidz: {
    totalRecords: number;
    avgScore: number;
    totalAyah: number;
  };
  murojaah: {
    totalRecords: number;
    avgQuality: number;
    totalPages: number;
  };
  simaan: {
    totalExams: number;
    passedExams: number;
    passRate: number;
  };
}

export interface QuickStats {
  activeStudents: number;
  activeTeachers: number;
  totalClasses: number;
  todayAttendance: number;
  todayMurojaah: number;
}

export interface MetricSnapshot {
  id: string;
  unitId?: string;
  academicYearId?: string;
  metricType: string;
  metricValue: number;
  metricData: any;
  periodType: string;
  periodDate: string;
  createdAt: string;
  unit?: { id: string; name: string };
  academicYear?: { id: string; name: string };
}

export interface TrendData {
  metricType: string;
  periodType: string;
  dataPoints: {
    date: string;
    value: number;
    data: any;
  }[];
  summary: {
    count: number;
    min: number;
    max: number;
    avg: number;
    trend: number;
  };
}

export interface UnitComparison {
  metricType: string;
  period: {
    start?: string;
    end?: string;
  };
  comparisons: {
    unit: {
      id: string;
      name: string;
      type: string;
    };
    metrics: {
      avg: number;
      sum: number;
      count: number;
    };
    stats: {
      students: number;
      teachers: number;
    };
  }[];
}

// ============================================
// Foundation Dashboard Types
// ============================================

export interface FoundationDashboardStats {
  foundationId: string;
  foundationName: string;

  // High level counts
  totalUnits: number;
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalBoardMembers: number;
  activeBoardMembers: number;
  totalDocuments: number;
  expiringDocuments: number;

  // Distributions
  unitsSummary: {
    id: string;
    name: string;
    type: string;
    _count: {
      students: number;
      teachers: number;
      staff: number;
    }
  }[];

  // Financial (Aggregated)
  financialSummary: {
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
    period: string; // e.g. "Last 30 Days"
  };

  // Unit Comparisons (for charts)
  studentsByUnit: {
    unitId: string;
    unitName: string;
    count: number;
  }[];

  staffByUnit: {
    unitId: string;
    unitName: string;
    count: number;
  }[];
}
