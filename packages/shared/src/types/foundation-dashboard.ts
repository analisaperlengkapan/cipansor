export interface FoundationDashboardStats {
  foundationId: string;
  foundationName: string;

  // Basic Counts
  totalUnits: number;
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;

  // Board & Documents
  totalBoardMembers: number;
  activeBoardMembers: number;
  totalDocuments: number;
  expiringDocuments: number;

  // Financial Summary (Current Month/Period)
  financialSummary: {
    revenue: number;
    expense: number;
    balance: number;
  };

  // Distributions
  studentDistribution: Record<string, number>; // Key is UnitType (e.g. "TK_QURAN": 50)

  // Detailed Unit Summary (Existing)
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
}
