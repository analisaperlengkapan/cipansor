export interface StudentRiskProfile {
  studentId: string;
  studentName: string;
  className: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  details: {
    behavior: {
      violationCount: number;
      totalPoints: number;
      riskContribution: number;
    };
    academic: {
      failingSubjects: number;
      gpa: number;
      riskContribution: number;
    };
    financial: {
      overdueInvoices: number;
      totalDebt: number;
      riskContribution: number;
    };
    attendance: {
      absenceCount: number;
      riskContribution: number;
    };
  };
}
