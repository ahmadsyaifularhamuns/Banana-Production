export interface ComparisonItem {
  group: string;
  parameter: string;
  unit: string;
  dataType: 'Aktual' | 'Demand' | 'Rolling Forcast' | 'Budget';
  monthlyCutDate: (number | null)[];
  monthlyCutDateTotal: number | null;
  monthlyCutWeek: (number | null)[];
  monthlyCutWeekTotal: number | null;
  weekly: (number | null)[];
  weeklyTotal: number | null;
  daily?: (number | null)[];
}

export interface ProgressItem {
  group: string;
  parameter: 'KALIBRASI' | 'UMUR' | 'Hanclass Panen';
  unit: string;
  dataType: string;
  monthlyCutDate: (number | null)[];
  weekly: (number | null)[];
}

export interface DefectItem {
  pg: string;
  location: 'Plantation' | 'Harvest & PH';
  rank: number;
  defectName: string;
  monthly: (number | null)[];
  weekly?: (number | null)[];
}

export interface LossesBananaItem {
  group: string;
  category: string;
  initials: string;
  cause: string;
  dataType: string;
  monthly: (number | null)[];
  weekly: (number | null)[];
}

export interface CurahDefectItem {
  pg: string;
  category: 'PLANTATION' | 'HARVEST' | 'PACKING HOUSE';
  defectName: string;
  monthly: (number | null)[];
  weekly: (number | null)[];
}

export interface CalibrationDistributionItem {
  pg: string;
  calibrationClass: string;
  dataType: string;
  monthly: (number | null)[];
  weekly: (number | null)[];
}

export interface DashboardData {
  generatedAt: string;
  months: string[];
  comparisonData: ComparisonItem[];
  progressParameters: ProgressItem[];
  defects: DefectItem[];
  curahDefects?: CurahDefectItem[];
  lossesBanana?: LossesBananaItem[];
  calibrationDistribution?: CalibrationDistributionItem[];
  source?: string;
  lastUpdateDate?: string;
}

export type ViewMode = 'monthlyCutDate' | 'monthlyCutWeek' | 'weekly' | 'daily';

export interface EvaluasiPlanProduct {
  name: string;
  unit: string;
  values: Record<string, Record<number, string>>;
}

export interface EvaluasiPlanGroup {
  name: string;
  products: EvaluasiPlanProduct[];
}

export interface EvaluasiPlanWeek {
  weekNum: number;
  monthLabel: string;
}

export interface EvaluasiPlanResponse {
  lastUpdated: string;
  weeks: EvaluasiPlanWeek[];
  groups: string[];
  dataByGroup: Record<string, EvaluasiPlanGroup>;
  source?: string;
  error?: string;
}
