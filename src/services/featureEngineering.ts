/**
 * Feature Engineering & Strict Leakage Guard for BritConnect
 */

import { CleanedCustomerRecord } from '../types/telecom';

export interface ModelFeatureMetadata {
  key: string;
  label: string;
  category: 'Usage' | 'Pricing' | 'Contract' | 'Payment Risk' | 'Service Experience' | 'Sentiment' | 'Lifecycle' | 'Demographic';
  dataType: 'numerical' | 'categorical' | 'binary';
  isSafe: boolean;
  leakageReason?: string;
  defaultIncluded: boolean;
  userIncluded: boolean;
  singleFeatureAuc?: number;
}

/**
 * Authoritative list of potential features and their leakage classification
 */
export const ALL_CANDIDATE_FEATURES: ModelFeatureMetadata[] = [
  // 1. LEAKAGE TARGETS (Always excluded by default)
  {
    key: 'id',
    label: 'Customer ID',
    category: 'Demographic',
    dataType: 'categorical',
    isSafe: false,
    leakageReason: 'Identifier (primary key) with arbitrary card-sequence; causes overfitting.',
    defaultIncluded: false,
    userIncluded: false,
  },
  {
    key: 'churnStatus',
    label: 'Churn Status',
    category: 'Lifecycle',
    dataType: 'categorical',
    isSafe: false,
    leakageReason: 'Direct label encoding of the target outcome.',
    defaultIncluded: false,
    userIncluded: false,
  },
  {
    key: 'churnFlag',
    label: 'Churn Flag',
    category: 'Lifecycle',
    dataType: 'binary',
    isSafe: false,
    leakageReason: 'Direct target variable (ground truth label).',
    defaultIncluded: false,
    userIncluded: false,
  },
  {
    key: 'churnDate',
    label: 'Churn Date',
    category: 'Lifecycle',
    dataType: 'categorical',
    isSafe: false,
    leakageReason: 'Known only after customer has already cancelled.',
    defaultIncluded: false,
    userIncluded: false,
  },
  {
    key: 'churnReason',
    label: 'Churn Reason',
    category: 'Lifecycle',
    dataType: 'categorical',
    isSafe: false,
    leakageReason: 'Recorded exclusively during or after the cancellation event.',
    defaultIncluded: false,
    userIncluded: false,
  },
  {
    key: 'monthlyRevenueAtRiskRaw',
    label: 'Monthly Revenue At Risk GBP',
    category: 'Pricing',
    dataType: 'numerical',
    isSafe: false,
    leakageReason: 'Derived downstream from churn risk scores.',
    defaultIncluded: false,
    userIncluded: false,
  },
  {
    key: 'lifetimeRevenue',
    label: 'Lifetime Revenue GBP',
    category: 'Pricing',
    dataType: 'numerical',
    isSafe: false,
    leakageReason: 'Scales directly with customer tenure and encodes tenure survival bias.',
    defaultIncluded: false,
    userIncluded: false,
  },

  // 2. SAFE PREDICTIVE FEATURES
  // Contract & Expiration Levers
  {
    key: 'monthsToContractEnd',
    label: 'Months to Contract End',
    category: 'Contract',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'contractExpiring30Days',
    label: 'Contract Expiring <= 30 Days Flag',
    category: 'Contract',
    dataType: 'binary',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'contractExpiring60Days',
    label: 'Contract Expiring <= 60 Days Flag',
    category: 'Contract',
    dataType: 'binary',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'autoRenew',
    label: 'Auto Renew Active',
    category: 'Contract',
    dataType: 'binary',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'contractType',
    label: 'Contract Type (Term)',
    category: 'Contract',
    dataType: 'categorical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'contractStage',
    label: 'Contract Stage (Renewal Window / Out-of-Contract)',
    category: 'Contract',
    dataType: 'categorical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },

  // Service Experience & Quality Levers
  {
    key: 'complaints12M',
    label: 'Complaints (Last 12 Months)',
    category: 'Service Experience',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'supportTickets12M',
    label: 'Support Tickets (Last 12 Months)',
    category: 'Service Experience',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'avgResolutionHours',
    label: 'Average Support Resolution (Hours)',
    category: 'Service Experience',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'networkOutages12M',
    label: 'Network Outages Experienced (12M)',
    category: 'Service Experience',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'experienceIndex',
    label: 'Combined Experience Index',
    category: 'Service Experience',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'complaintRate',
    label: 'Complaint Rate (Complaints / Tickets)',
    category: 'Service Experience',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'ticketsPerTenureYear',
    label: 'Annualised Tickets per Tenure Year',
    category: 'Service Experience',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },

  // Sentiment & Competition Levers
  {
    key: 'satisfactionScore',
    label: 'Customer Satisfaction Score (1-10)',
    category: 'Sentiment',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'npsScore',
    label: 'Net Promoter Score',
    category: 'Sentiment',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'sentimentGap',
    label: 'Sentiment Gap (NPS vs CSAT)',
    category: 'Sentiment',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'competitorOfferReceived',
    label: 'Competitor Offer Received',
    category: 'Sentiment',
    dataType: 'binary',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },

  // Usage & Allowance Levers
  {
    key: 'usageToAllowanceRatio',
    label: 'Usage-to-Allowance Ratio',
    category: 'Usage',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'overAllowanceFlag',
    label: 'Exceeded Allowance Flag',
    category: 'Usage',
    dataType: 'binary',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'overageCharges',
    label: 'Overage Charges GBP (£)',
    category: 'Usage',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'avgUsageGB',
    label: 'Average Monthly Usage (GB)',
    category: 'Usage',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },

  // Pricing & Commercial Levers
  {
    key: 'effectiveMonthlyCharge',
    label: 'Effective Monthly Charge GBP (£)',
    category: 'Pricing',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'discountPercent',
    label: 'Discount Percent (%)',
    category: 'Pricing',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'serviceType',
    label: 'Service Type',
    category: 'Pricing',
    dataType: 'categorical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },

  // Payment Behaviour
  {
    key: 'paymentRiskIndex',
    label: 'Payment Risk Index (Late + 2×Failed)',
    category: 'Payment Risk',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'directDebit',
    label: 'Direct Debit Active',
    category: 'Payment Risk',
    dataType: 'binary',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'latePayments12M',
    label: 'Late Payments (12M)',
    category: 'Payment Risk',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },

  // Lifecycle & Demographics
  {
    key: 'tenureMonths',
    label: 'Tenure (Months)',
    category: 'Lifecycle',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'tenureBucket',
    label: 'Tenure Bucket',
    category: 'Lifecycle',
    dataType: 'categorical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'segment',
    label: 'Customer Segment',
    category: 'Demographic',
    dataType: 'categorical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'age',
    label: 'Customer Age',
    category: 'Demographic',
    dataType: 'numerical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
  {
    key: 'nation',
    label: 'UK Nation',
    category: 'Demographic',
    dataType: 'categorical',
    isSafe: true,
    defaultIncluded: true,
    userIncluded: true,
  },
];

/**
 * Transform customer record into numerical feature vector for ML
 */
export interface FeatureVector {
  names: string[];
  values: number[];
}

export interface EncodingSchema {
  featureNames: string[];
  means: number[];
  stds: number[];
  categoricalMaps: Record<string, string[]>; // key -> distinct category values
}

/**
 * Build one-hot encoding schema and normalization parameters from training records
 */
export function buildEncodingSchema(
  records: CleanedCustomerRecord[],
  selectedFeatureKeys: string[]
): EncodingSchema {
  const featureNames: string[] = [];
  const categoricalMaps: Record<string, string[]> = {};

  const safeFeatures = ALL_CANDIDATE_FEATURES.filter(
    (f) => selectedFeatureKeys.includes(f.key) && f.isSafe
  );

  for (const f of safeFeatures) {
    if (f.dataType === 'numerical' || f.dataType === 'binary') {
      featureNames.push(f.key);
    } else if (f.dataType === 'categorical') {
      // Collect top distinct categories
      const distinct = Array.from(
        new Set(records.map((r) => String((r as any)[f.key] || 'Other')))
      ).slice(0, 10); // cap to top 10 categories
      categoricalMaps[f.key] = distinct;
      for (const cat of distinct) {
        featureNames.push(`${f.key}_is_${cat}`);
      }
    }
  }

  // Calculate means and standard deviations for numerical features
  const matrix: number[][] = records.map((r) => encodeRecord(r, featureNames, categoricalMaps));
  const means: number[] = new Array(featureNames.length).fill(0);
  const stds: number[] = new Array(featureNames.length).fill(1);

  for (let j = 0; j < featureNames.length; j++) {
    let sum = 0;
    for (let i = 0; i < matrix.length; i++) {
      sum += matrix[i][j];
    }
    const mean = sum / Math.max(1, matrix.length);
    means[j] = mean;

    let varSum = 0;
    for (let i = 0; i < matrix.length; i++) {
      varSum += Math.pow(matrix[i][j] - mean, 2);
    }
    const std = Math.sqrt(varSum / Math.max(1, matrix.length - 1)) || 1;
    stds[j] = std === 0 ? 1 : std;
  }

  return { featureNames, means, stds, categoricalMaps };
}

/**
 * Encode a single customer record into standard numeric array
 */
export function encodeRecord(
  r: CleanedCustomerRecord,
  featureNames: string[],
  categoricalMaps: Record<string, string[]>
): number[] {
  const row: number[] = [];

  for (const feat of featureNames) {
    if (feat.includes('_is_')) {
      const [colKey, catVal] = feat.split('_is_');
      const actualVal = String((r as any)[colKey] || '');
      row.push(actualVal === catVal ? 1 : 0);
    } else {
      const rawVal = (r as any)[feat];
      if (typeof rawVal === 'boolean') {
        row.push(rawVal ? 1 : 0);
      } else {
        const n = Number(rawVal);
        row.push(isNaN(n) ? 0 : n);
      }
    }
  }

  return row;
}

/**
 * Standardise feature vector (z-score: (x - mean) / std)
 */
export function standardizeVector(vec: number[], means: number[], stds: number[]): number[] {
  return vec.map((v, i) => (v - (means[i] || 0)) / (stds[i] || 1));
}
