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
