export interface FoundationDashboardStats {
  foundationId: string;
  foundationName: string;
  summary: {
    totalUnits: number;
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    totalAssets: number; // Value in IDR
    totalRevenueMonth: number; // Current month revenue
    totalExpenseMonth: number; // Current month expense
  };
  unitsDistribution: {
    id: string;
    name: string;
    type: string;
    studentCount: number;
    teacherCount: number;
    staffCount: number;
  }[];
  financialTrend: {
    period: string; // e.g. "Jan 2024"
    revenue: number;
    expense: number;
  }[];
  recentDocuments: {
    id: string;
    name: string;
    type: string;
    expiryDate?: string;
    status: 'valid' | 'expiring' | 'expired';
  }[];
}
