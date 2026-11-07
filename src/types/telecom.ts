/**
 * BritConnect AI Customer Churn Intelligence Platform
 * Authoritative Schema & Data Types
 */

export interface RawCustomerRecord {
  'Customer ID': string;
  'Customer Segment': 'Consumer' | 'Small Business' | string;
  'Age': number | string;
  'Age Band'?: string;
  'Gender': 'Female' | 'Male' | 'Other' | 'Unknown' | string;
  'UK Nation': 'England' | 'Scotland' | 'Wales' | 'Northern Ireland' | string;
  'City': string;
  'Acquisition Channel': string;
  'Join Date': string;
  'Tenure Months': number | string;
  'Service Type': 'Fibre Broadband' | 'Standard Broadband' | 'Mobile SIM-Only' | 'Mobile Device Contract' | 'Triple Play Bundle' | string;
  'Plan Name': string;
  'Contract Type': '12 Month' | '24 Month' | '36 Month' | 'Rolling 30-Day' | string;
  'Contract Start Date': string;
  'Contract End Date'?: string;
  'Auto Renew': 'Yes' | 'No' | string;
  'Monthly Charge GBP': number | string;
  'Average Monthly Usage GB': number | string;
  'Data Allowance GB': number | string;
  'Overage Charges GBP': number | string;
  'Discount Percent': number | string;
  'Payment Method': 'Direct Debit' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Cheque' | string;
  'Direct Debit': 'Yes' | 'No' | string;
  'Late Payments 12M': number | string;
  'Failed Payments 12M': number | string;
  'Support Tickets 12M': number | string;
  'Complaints 12M': number | string;
  'Average Resolution Hours': number | string;
  'Network Outages 12M': number | string;
  'Satisfaction Score 1 10': number | string;
  'NPS Score': number | string;
  'Competitor Offer Received': 'Yes' | 'No' | string;
  'Churn Status': 'Active' | 'Churned' | string;
  'Churn Date'?: string;
  'Churn Reason'?: string;
  'Lifetime Revenue GBP': number | string;
  'Monthly Revenue At Risk GBP'?: number | string;
  'Churn Flag': number | string; // 1 = Churned, 0 = Active
  [key: string]: any;
}

export interface CleanedCustomerRecord {
  id: string;
  segment: 'Consumer' | 'Small Business';
  age: number;
  ageBand: string;
  gender: string;
  nation: 'England' | 'Scotland' | 'Wales' | 'Northern Ireland' | string;
  city: string;
  channel: string;
  joinDate: string; // YYYY-MM-DD
  tenureMonths: number;
  serviceType: string;
  planName: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate?: string;
  autoRenew: boolean;
  monthlyCharge: number;
  avgUsageGB: number;
  dataAllowanceGB: number;
  overageCharges: number;
  discountPercent: number;
  paymentMethod: string;
  directDebit: boolean;
  latePayments12M: number;
  failedPayments12M: number;
  supportTickets12M: number;
  complaints12M: number;
  avgResolutionHours: number;
  networkOutages12M: number;
  satisfactionScore: number; // 1 to 10
  npsScore: number;
  competitorOfferReceived: boolean;
  churnStatus: 'Active' | 'Churned';
  churnDate?: string;
  churnReason?: string;
  lifetimeRevenue: number;
  monthlyRevenueAtRiskRaw?: number;
  churnFlag: 0 | 1;

  // Engineered features
  effectiveMonthlyCharge: number;
  usageToAllowanceRatio: number;
  overAllowanceFlag: 0 | 1;
  chargePerGB: number;
  monthsToContractEnd: number;
  contractExpiring30Days: 0 | 1;
  contractExpiring60Days: 0 | 1;
  contractExpiring90Days: 0 | 1;
  contractStage: 'In-Term' | 'Renewal Window' | 'Out-of-Contract';
  paymentRiskIndex: number;
  complaintRate: number;
  ticketsPerTenureYear: number;
  experienceIndex: number; // Combined outages, tickets, complaints, resolution time
  sentimentGap: number;
  tenureBucket: '0-6m' | '7-12m' | '13-24m' | '25-48m' | '49m+';
  npsCategory: 'Detractor' | 'Passive' | 'Promoter';

  // Scoring outputs (when scored)
  churnProbability?: number; // 0.00 to 1.00
  riskTier?: 'Critical' | 'High' | 'Medium' | 'Low';
  riskPercentile?: number;
  expectedMonthlyRevenueAtRisk?: number; // churnProbability * effectiveMonthlyCharge
  expectedLoss12M?: number;
  topDrivers?: LocalDriverExplanation[];
  clusterId?: number;
  ruleSegment?: string;

  // Additional raw extra columns preserved
  rawFields?: Record<string, any>;
}

export interface LocalDriverExplanation {
  featureKey: string;
  featureLabel: string;
  impactScore: number; // positive = pushes risk higher (+pts), negative = protective (-pts)
  impactPoints: number; // e.g. +14
  direction: 'risk_increasing' | 'risk_decreasing';
  plainEnglish: string;
  currentValue: string | number;
}

export type RiskTier = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ColumnSchemaDefinition {
  colNumber: number;
  name: string;
  type: 'Text' | 'Whole Number' | 'Decimal' | 'Date' | 'Binary';
  description: string;
  required: boolean;
  aliases: string[];
  allowedValues?: string[];
  min?: number;
  max?: number;
  isLeakageTarget?: boolean;
}

export interface ValidationIssue {
  severity: 'Error' | 'Warning' | 'Info';
  column: string;
  message: string;
  count: number;
  sample?: any[];
}

export interface ValidationReport {
  dataQualityScore: number; // 0-100
  totalRows: number;
  totalColumns: number;
  missingRequiredColumns: string[];
  unmappedColumns: string[];
  duplicateIdCount: number;
  duplicateIdSamples: string[];
  columnMissingness: { column: string; count: number; percentage: number }[];
  rangeIssues: ValidationIssue[];
  categoricalIssues: ValidationIssue[];
  consistencyIssues: ValidationIssue[];
  dateIssues: ValidationIssue[];
  targetClassBalance: { active: number; churned: number; churnRate: number };
  detectedNpsScale: '-100..100' | '0..10' | 'unknown';
  canTrain: boolean;
  canScore: boolean;
}

export interface CleaningActionLog {
  id: string;
  timestamp: string;
  step: string;
  description: string;
  rowsAffected: number;
  details: string;
  applied: boolean;
}

export interface GlobalFilterState {
  segment: string;
  serviceType: string;
  planName: string;
  nation: string;
  city: string;
  channel: string;
  contractType: string;
  ageBand: string;
  gender: string;
  riskTier: string;
  joinDateFrom: string;
  joinDateTo: string;
  searchQuery: string;
}

export interface ModelMetrics {
  rocAuc: number;
  prAuc: number;
  accuracy: number;
  balancedAccuracy: number;
  precision: number;
  recall: number;
  f1: number;
  specificity: number;
  brierScore: number;
  logLoss: number;
  mcc: number;
  ksStatistic: number;
  topDecileLift: number;
  gini: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
  };
  cvRocAucMean: number;
  cvRocAucStd: number;
  cvPrAucMean: number;
  cvPrAucStd: number;
  rocCurve: { fpr: number; tpr: number; threshold: number }[];
  prCurve: { recall: number; precision: number; threshold: number }[];
  calibrationCurve: { meanPredicted: number; observedFraction: number; count: number }[];
}

export interface TrainedModelSummary {
  id: string;
  name: string;
  algorithm: 'Logistic Regression' | 'Decision Tree' | 'Random Forest' | 'Gradient Boosted Trees';
  trainedAt: string;
  dataVersionId: string;
  trainRowCount: number;
  testRowCount: number;
  featuresUsed: string[];
  featuresExcluded: string[];
  isChampion: boolean;
  metrics: ModelMetrics;
  optimalThreshold: number;
  hyperparameters: Record<string, any>;
  fairnessCheck: {
    attribute: string;
    groups: { group: string; count: number; recall: number; precision: number; churnRate: number }[];
    disparityWarning: boolean;
  }[];
  psiDriftCheck?: {
    feature: string;
    psi: number;
    status: 'Stable' | 'Moderate Drift' | 'Significant Drift';
  }[];
  serializedModel: any;
}

export interface CampaignRecord {
  id: string;
  name: string;
  objective: string;
  targetCriteria: {
    segment?: string;
    riskTier?: string;
    contractEndingDays?: number;
    customFilterDescription?: string;
  };
  offerType: 'Loyalty Discount' | 'Free Speed/Data Upgrade' | 'Proactive VIP Service Call' | '12-Month Contract Renewal Bonus' | 'Bill Credit Goodwill' | 'Device Subsidy';
  channel: 'Direct Phone Call' | 'Personalised Email' | 'Priority SMS' | 'In-App Banner & Notification' | 'Postal Letter';
  status: 'Planned' | 'Active' | 'Completed';
  startDate: string;
  endDate: string;
  budgetGBP: number;
  costPerContactGBP: number;
  offerCostPerAcceptGBP: number;
  owner: string;
  controlGroupPercentage: number; // e.g. 15%
  holdoutSeed: number;

  // Results
  customerCount: number;
  contactedCount: number;
  respondedCount: number;
  acceptedCount: number;
  treatedSaves: number;
  controlSaves: number;
  treatedRetentionRate: number; // %
  controlRetentionRate: number; // %
  upliftPercentagePoints: number; // treated - control
  upliftPValue: number;
  upliftConfInterval95: [number, number];
  retainedRevenueGBP: number;
  totalCostGBP: number;
  netROI: number; // (retained - cost) / cost
  costPerSaveGBP: number;
  paybackPeriodMonths: number;
  outcomesLoaded: boolean;
}

export interface BusinessAssumptions {
  costPerContact: number; // £
  expectedSaveRate: number; // %
  averageMarginPercent: number; // %
  planningHorizonMonths: number; // e.g. 12
  criticalRiskCutoff: number; // default 0.70
  highRiskCutoff: number; // default 0.50
  mediumRiskCutoff: number; // default 0.30
  referenceDate: string; // 2026-11-07
}

export interface DatasetVersionMeta {
  id: string;
  timestamp: string;
  fileName: string;
  rowCount: number;
  action: 'initial_upload' | 'merge_upsert' | 'replace' | 'score_only';
  addedRows: number;
  updatedRows: number;
  rejectedRows: number;
}
