export interface FoundationExecutiveSummary {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalUnits: number;
  /** Registrants still in the admissions pipeline (not yet enrolled/rejected/cancelled). */
  activeAdmissions: number;
  growth: {
    students: number;
  };
}

export interface FoundationFinancialOverview {
  currentMonth: {
    revenue: number;
    expense: number;
    net: number;
  };
  lastMonth: {
    revenue: number;
    expense: number;
    net: number;
  };
  byUnit: {
    unitId: string;
    unitName: string;
    revenue: number;
    expense: number;
  }[];
  // Added for PR #3 UI compatibility
  expenseComposition?: {
    name: string;
    value: number;
  }[];
  units?: {
    unitId: string;
    unitName: string;
    revenue: number;
    expense: number;
    netIncome: number;
    students: number;
  }[];
  /** Cash position derived from balance-sheet accounts. */
  cashPosition?: {
    cashOnHand: number;
    receivables: number;
    payables: number;
  };
  /** Revenue vs expense for the trailing 6 months (oldest first). */
  monthlyTrend?: {
    month: string;
    revenue: number;
    expense: number;
  }[];
}

export interface FoundationUnitComparison {
  unitId: string;
  unitName: string;
  studentCount: number;
  teacherCount: number;
  studentTeacherRatio: number;
  averageGrade: number;
}

export interface FoundationDashboardStats {
  executive: FoundationExecutiveSummary;
  financial: FoundationFinancialOverview;
  units: FoundationUnitComparison[];
}
