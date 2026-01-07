export interface FoundationExecutiveSummary {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalUnits: number;
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
