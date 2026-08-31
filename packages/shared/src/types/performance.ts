export interface BehavioralValueDTO {
  id: string;
  name: string;
  description?: string | null;
  weight: number;
  isActive: boolean;
}

export interface SupervisorDTO {
  id: string;
  name: string;
  unit?: { id: string; name: string } | null;
}

export interface PKIndicatorDTO {
  id: string;
  pkId: string;
  title: string;
  target: number;
  unit: string;
  weight: number;
  category: "DIRECT" | "INDIRECT" | "NON_CASCADING";
  refIndicatorId?: string | null;
  refStrategicIndicatorId?: string | null;
  notes?: string | null;
  realization: number;
  refIndicator?: { id: string; title: string } | null;
  refStrategicIndicator?: { id: string; name: string } | null;
}

export interface PKIndicatorEvaluationDTO {
  id: string;
  evaluationId: string;
  indicatorId: string;
  realization: number;
  activities?: string | null;
  score: number;
  indicator?: PKIndicatorDTO;
}

export interface PKBehaviorEvaluationDTO {
  id: string;
  evaluationId: string;
  behaviorValueId: string;
  score: number;
  notes?: string | null;
  behaviorValue?: BehavioralValueDTO;
}

export interface PKEvaluationDTO {
  id: string;
  pkId: string;
  period: string;
  month: number;
  year: number;
  performanceScore: number;
  behaviorScore: number;
  overallScore: number;
  feedback?: string | null;
  notes?: string | null;
  status: "DRAFT" | "PROPOSED" | "APPROVED";
  pk?: PerformanceAgreementDTO;
  indicatorDetails?: PKIndicatorEvaluationDTO[];
  behaviorDetails?: PKBehaviorEvaluationDTO[];
}

export interface PerformanceAgreementDTO {
  id: string;
  userId: string;
  supervisorId?: string | null;
  supervisorPkId?: string | null;
  strategicPlanId?: string | null;
  periodStart: string;
  periodEnd: string;
  status: "DRAFT" | "PROPOSED" | "APPROVED";
  totalScore: number;
  behaviorScore: number;
  overallScore: number;
  notes?: string | null;
  revisionNotes?: string | null;
  approvedAt?: string | null;
  user: { id: string; name: string };
  supervisor?: { id: string; name: string } | null;
  strategicPlan?: { id: string; title: string } | null;
  indicators?: PKIndicatorDTO[];
  evaluations?: PKEvaluationDTO[];
}

export interface UnitPerformanceMetricDTO {
  id: string;
  name: string;
  avgScore: number;
  avgPerformanceScore: number;
  avgBehaviorScore: number;
  pkCount: number;
}

export interface PerformanceDashboardDTO {
  totalAgreements: number;
  approvedAgreements: number;
  totalEvaluations: number;
  avgPerformanceScore: number;
  avgBehaviorScore: number;
  bestPerformingUnits: UnitPerformanceMetricDTO[];
  worstPerformingUnits: UnitPerformanceMetricDTO[];
  allUnits: UnitPerformanceMetricDTO[];
}

export interface PerformanceDrilldownDTO {
  unit: { id: string; name: string } | null;
  strategicPlan?: { id: string; title: string; progress: number } | null;
  agreements: PerformanceAgreementDTO[];
}

export interface ConsolidatedUnitReportDTO {
  id: string;
  name: string;
  totalAgreements: number;
  approvedAgreements: number;
  avgOverallScore: number;
  avgPerformanceScore: number;
  avgBehaviorScore: number;
}

export interface PerformanceConsolidatedReportDTO {
  units: ConsolidatedUnitReportDTO[];
}
