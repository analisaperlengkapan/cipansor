export interface FoundationUnitSummary {
  id: string;
  name: string;
  type: string;
  studentCount: number;
  teacherCount: number;
  staffCount: number;
}

export interface FoundationDashboardStats {
  foundationId: string;
  foundationName: string;
  totalUnits: number;
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalBoardMembers: number;
  activeBoardMembers: number;
  totalDocuments: number;
  expiringDocuments: number;

  // Financials (New)
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;

  // Breakdowns
  unitsSummary: FoundationUnitSummary[];
}
