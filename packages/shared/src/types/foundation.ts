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
  unitsSummary: {
    id: string;
    name: string;
    type: string;
    _count: {
      students: number;
      teachers: number;
      staff: number;
    };
  }[];
  financialSummary: {
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
  };
  studentDistribution: {
    unitName: string;
    count: number;
  }[];
}
