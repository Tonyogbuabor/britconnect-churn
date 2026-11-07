/**
 * BritConnect 38-Column Authoritative Schema Registry
 * Supports fuzzy matching, aliases, type coercion, and template exports
 */

import { ColumnSchemaDefinition } from '../types/telecom';
import * as XLSX from 'xlsx';

export const AUTHORITATIVE_COLUMNS: ColumnSchemaDefinition[] = [
  {
    colNumber: 1,
    name: 'Customer ID',
    type: 'Text',
    description: 'Unique customer identifier (primary key)',
    required: true,
    aliases: ['customer_id', 'customerid', 'cust_id', 'custid', 'id', 'account_number', 'account_id', 'client_id'],
  },
  {
    colNumber: 2,
    name: 'Customer Segment',
    type: 'Text',
    description: 'Consumer or Small Business',
    required: false,
    aliases: ['customer_segment', 'segment', 'customer_type', 'account_type', 'client_type'],
    allowedValues: ['Consumer', 'Small Business'],
  },
  {
    colNumber: 3,
    name: 'Age',
    type: 'Whole Number',
    description: 'Age in years',
    required: false,
    aliases: ['age', 'customer_age', 'user_age'],
    min: 16,
    max: 110,
  },
  {
    colNumber: 4,
    name: 'Age Band',
    type: 'Text',
    description: 'Demographic age grouping',
    required: false,
    aliases: ['age_band', 'age_group', 'age_bracket', 'demographic_group'],
    allowedValues: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
  },
  {
    colNumber: 5,
    name: 'Gender',
    type: 'Text',
    description: 'Recorded gender',
    required: false,
    aliases: ['gender', 'sex'],
    allowedValues: ['Female', 'Male', 'Non-Binary', 'Other', 'Unknown'],
  },
  {
    colNumber: 6,
    name: 'UK Nation',
    type: 'Text',
    description: 'England, Scotland, Wales, Northern Ireland',
    required: false,
    aliases: ['uk_nation', 'nation', 'country', 'region', 'uk_region', 'home_nation'],
    allowedValues: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  },
  {
    colNumber: 7,
    name: 'City',
    type: 'Text',
    description: 'Customer city',
    required: false,
    aliases: ['city', 'town', 'location', 'customer_city'],
  },
  {
    colNumber: 8,
    name: 'Acquisition Channel',
    type: 'Text',
    description: 'How the customer was acquired',
    required: false,
    aliases: ['acquisition_channel', 'channel', 'source', 'signup_channel', 'lead_source'],
    allowedValues: ['Online Direct', 'Retail Store', 'Price Comparison Website', 'Telesales', 'Referral / Word of Mouth', 'Field Sales'],
  },
  {
    colNumber: 9,
    name: 'Join Date',
    type: 'Date',
    description: 'First joined BritConnect',
    required: false,
    aliases: ['join_date', 'joindate', 'signup_date', 'start_date', 'customer_since', 'created_at'],
  },
  {
    colNumber: 10,
    name: 'Tenure Months',
    type: 'Whole Number',
    description: 'Length of relationship in months',
    required: false,
    aliases: ['tenure_months', 'tenure', 'tenure_m', 'months_with_company', 'relationship_months'],
    min: 0,
  },
  {
    colNumber: 11,
    name: 'Service Type',
    type: 'Text',
    description: 'Telecom service subscribed to',
    required: false,
    aliases: ['service_type', 'service', 'product_type', 'telecom_service', 'primary_service'],
    allowedValues: ['Fibre Broadband', 'Standard Broadband', 'Mobile SIM-Only', 'Mobile Device Contract', 'Triple Play Bundle'],
  },
  {
    colNumber: 12,
    name: 'Plan Name',
    type: 'Text',
    description: 'Subscription package name',
    required: false,
    aliases: ['plan_name', 'plan', 'package', 'package_name', 'tariff', 'tariff_name'],
  },
  {
    colNumber: 13,
    name: 'Contract Type',
    type: 'Text',
    description: 'Contract arrangement or term',
    required: false,
    aliases: ['contract_type', 'contract_term', 'term', 'commitment_type', 'agreement_type'],
    allowedValues: ['12 Month', '24 Month', '36 Month', 'Rolling 30-Day'],
  },
  {
    colNumber: 14,
    name: 'Contract Start Date',
    type: 'Date',
    description: 'Current contract start',
    required: false,
    aliases: ['contract_start_date', 'contract_start', 'agreement_start', 'term_start'],
  },
  {
    colNumber: 15,
    name: 'Contract End Date',
    type: 'Date',
    description: 'Scheduled expiry, where applicable',
    required: false,
    aliases: ['contract_end_date', 'contract_end', 'agreement_end', 'expiry_date', 'term_end'],
  },
  {
    colNumber: 16,
    name: 'Auto Renew',
    type: 'Text',
    description: 'Yes/No auto renewal',
    required: false,
    aliases: ['auto_renew', 'autorenew', 'auto_renewal', 'evergreen'],
    allowedValues: ['Yes', 'No'],
  },
  {
    colNumber: 17,
    name: 'Monthly Charge GBP',
    type: 'Decimal',
    description: 'Monthly subscription charge (£)',
    required: false,
    aliases: ['monthly_charge_gbp', 'monthly_charge', 'monthly_fee', 'mrc', 'charge_gbp', 'cost_per_month', 'monthly_cost'],
    min: 0,
  },
  {
    colNumber: 18,
    name: 'Average Monthly Usage GB',
    type: 'Decimal',
    description: 'Average monthly data usage',
    required: false,
    aliases: ['average_monthly_usage_gb', 'avg_monthly_usage_gb', 'usage_gb', 'data_usage_gb', 'avg_usage', 'data_used_gb'],
    min: 0,
  },
  {
    colNumber: 19,
    name: 'Data Allowance GB',
    type: 'Whole Number',
    description: 'Included monthly data allowance',
    required: false,
    aliases: ['data_allowance_gb', 'allowance_gb', 'data_limit_gb', 'cap_gb', 'quota_gb'],
    min: 0,
  },
  {
    colNumber: 20,
    name: 'Overage Charges GBP',
    type: 'Decimal',
    description: 'Additional usage charges (£)',
    required: false,
    aliases: ['overage_charges_gbp', 'overage_charges', 'overage_fee', 'overage_gbp', 'excess_charges'],
    min: 0,
  },
  {
    colNumber: 21,
    name: 'Discount Percent',
    type: 'Decimal',
    description: 'Discount applied (%)',
    required: false,
    aliases: ['discount_percent', 'discount_pct', 'discount', 'discount_rate', 'applied_discount'],
    min: 0,
    max: 100,
  },
  {
    colNumber: 22,
    name: 'Payment Method',
    type: 'Text',
    description: 'Payment method',
    required: false,
    aliases: ['payment_method', 'pay_method', 'billing_method', 'billing_type'],
    allowedValues: ['Direct Debit', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Cheque'],
  },
  {
    colNumber: 23,
    name: 'Direct Debit',
    type: 'Text',
    description: 'Yes/No',
    required: false,
    aliases: ['direct_debit', 'dd_active', 'is_direct_debit', 'has_direct_debit'],
    allowedValues: ['Yes', 'No'],
  },
  {
    colNumber: 24,
    name: 'Late Payments 12M',
    type: 'Whole Number',
    description: 'Late payments, last 12 months',
    required: false,
    aliases: ['late_payments_12m', 'late_payments', 'late_pays_12m', 'delinquent_payments'],
    min: 0,
  },
  {
    colNumber: 25,
    name: 'Failed Payments 12M',
    type: 'Whole Number',
    description: 'Failed payments, last 12 months',
    required: false,
    aliases: ['failed_payments_12m', 'failed_payments', 'failed_pays_12m', 'bounced_payments'],
    min: 0,
  },
  {
    colNumber: 26,
    name: 'Support Tickets 12M',
    type: 'Whole Number',
    description: 'Tickets, last 12 months',
    required: false,
    aliases: ['support_tickets_12m', 'support_tickets', 'tickets_12m', 'service_tickets', 'ticket_count'],
    min: 0,
  },
  {
    colNumber: 27,
    name: 'Complaints 12M',
    type: 'Whole Number',
    description: 'Complaints, last 12 months',
    required: false,
    aliases: ['complaints_12m', 'complaints', 'complaint_count', 'formal_complaints'],
    min: 0,
  },
  {
    colNumber: 28,
    name: 'Average Resolution Hours',
    type: 'Decimal',
    description: 'Mean time to resolve issues',
    required: false,
    aliases: ['average_resolution_hours', 'avg_resolution_hours', 'resolution_hours', 'mean_resolution_time', 'mtt_resolve'],
    min: 0,
  },
  {
    colNumber: 29,
    name: 'Network Outages 12M',
    type: 'Whole Number',
    description: 'Outages, last 12 months',
    required: false,
    aliases: ['network_outages_12m', 'network_outages', 'outages_12m', 'outage_count', 'service_interruptions'],
    min: 0,
  },
  {
    colNumber: 30,
    name: 'Satisfaction Score 1 10',
    type: 'Whole Number',
    description: 'CSAT, 1 to 10',
    required: false,
    aliases: ['satisfaction_score_1_10', 'satisfaction_score', 'satisfaction', 'csat', 'csat_score', 'satisfaction_1_10', 'satisfaction score (1-10)'],
    min: 1,
    max: 10,
  },
  {
    colNumber: 31,
    name: 'NPS Score',
    type: 'Whole Number',
    description: 'Advocacy score (higher = stronger advocacy)',
    required: false,
    aliases: ['nps_score', 'nps', 'net_promoter_score', 'advocacy_score'],
  },
  {
    colNumber: 32,
    name: 'Competitor Offer Received',
    type: 'Text',
    description: 'Yes/No',
    required: false,
    aliases: ['competitor_offer_received', 'competitor_offer', 'rival_offer', 'poached_flag'],
    allowedValues: ['Yes', 'No'],
  },
  {
    colNumber: 33,
    name: 'Churn Status',
    type: 'Text',
    description: 'Active or Churned',
    required: false,
    aliases: ['churn_status', 'status', 'customer_status', 'account_status'],
    allowedValues: ['Active', 'Churned'],
    isLeakageTarget: true,
  },
  {
    colNumber: 34,
    name: 'Churn Date',
    type: 'Date',
    description: 'Cancellation date (blank if active)',
    required: false,
    aliases: ['churn_date', 'cancellation_date', 'terminated_date', 'exit_date'],
    isLeakageTarget: true,
  },
  {
    colNumber: 35,
    name: 'Churn Reason',
    type: 'Text',
    description: 'Cancellation reason (blank if active)',
    required: false,
    aliases: ['churn_reason', 'cancellation_reason', 'reason_for_leaving', 'exit_reason'],
    isLeakageTarget: true,
  },
  {
    colNumber: 36,
    name: 'Lifetime Revenue GBP',
    type: 'Decimal',
    description: 'Cumulative revenue (£)',
    required: false,
    aliases: ['lifetime_revenue_gbp', 'lifetime_revenue', 'clv', 'ltv', 'total_revenue', 'cumulative_revenue_gbp'],
    min: 0,
    isLeakageTarget: true, // Warn: scales with tenure
  },
  {
    colNumber: 37,
    name: 'Monthly Revenue At Risk GBP',
    type: 'Decimal',
    description: 'Estimated monthly revenue exposed to churn (£)',
    required: false,
    aliases: ['monthly_revenue_at_risk_gbp', 'monthly_revenue_at_risk', 'revenue_at_risk', 'mrr_at_risk'],
    min: 0,
    isLeakageTarget: true,
  },
  {
    colNumber: 38,
    name: 'Churn Flag',
    type: 'Whole Number',
    description: 'Target. 1 = Churned, 0 = Active',
    required: false,
    aliases: ['churn_flag', 'churn', 'churned', 'is_churn', 'is_churned', 'target', 'churn_label'],
    allowedValues: ['0', '1'],
    min: 0,
    max: 1,
    isLeakageTarget: true,
  },
];

/**
 * Normalise a string for fuzzy comparison: remove punctuation, lowercase, collapse spaces
 */
export function normaliseHeader(str: string): string {
  if (!str) return '';
  // Strip UTF-8 BOM if present
  let clean = str.replace(/^\uFEFF/, '');
  clean = clean.toLowerCase()
    .replace(/[_\-–—/\\(),.:;'"[\]{}!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean;
}

/**
 * Fuzzy match an incoming column header to the schema definitions
 */
export function matchHeaderToSchema(incomingHeader: string): {
  matchedColumn: ColumnSchemaDefinition | null;
  confidence: number; // 0 to 1
  matchReason?: string;
} {
  const norm = normaliseHeader(incomingHeader);
  if (!norm) return { matchedColumn: null, confidence: 0 };

  // 1. Exact match with canonical name
  for (const col of AUTHORITATIVE_COLUMNS) {
    if (normaliseHeader(col.name) === norm) {
      return { matchedColumn: col, confidence: 1.0, matchReason: 'Exact name match' };
    }
  }

  // 2. Exact match with known aliases
  for (const col of AUTHORITATIVE_COLUMNS) {
    for (const alias of col.aliases) {
      if (normaliseHeader(alias) === norm) {
        return { matchedColumn: col, confidence: 0.95, matchReason: `Matched alias '${alias}'` };
      }
    }
  }

  // 3. Substring / Token overlap match
  const normTokens = new Set(norm.split(' '));
  let bestCol: ColumnSchemaDefinition | null = null;
  let bestScore = 0;

  for (const col of AUTHORITATIVE_COLUMNS) {
    const colTokens = normaliseHeader(col.name).split(' ');
    let overlap = 0;
    for (const token of colTokens) {
      if (normTokens.has(token)) overlap++;
    }
    const score = overlap / Math.max(colTokens.length, normTokens.size);
    if (score > bestScore && score >= 0.6) {
      bestScore = score;
      bestCol = col;
    }
  }

  if (bestCol) {
    return { matchedColumn: bestCol, confidence: Math.round(bestScore * 100) / 100, matchReason: 'Fuzzy token match' };
  }

  return { matchedColumn: null, confidence: 0 };
}

/**
 * Generate a blank CSV template with all 38 headers
 */
export function generateBlankCsvTemplate(): string {
  return AUTHORITATIVE_COLUMNS.map(c => `"${c.name}"`).join(',') + '\n';
}

/**
 * Generate a blank XLSX template with all 38 headers and format metadata
 */
export function generateBlankXlsxTemplate(): Uint8Array {
  const headers = AUTHORITATIVE_COLUMNS.map(c => c.name);
  const sampleRow: Record<string, any> = {};
  AUTHORITATIVE_COLUMNS.forEach(c => {
    if (c.name === 'Customer ID') sampleRow[c.name] = 'CUST-001001';
    else if (c.name === 'Customer Segment') sampleRow[c.name] = 'Consumer';
    else if (c.name === 'Age') sampleRow[c.name] = 38;
    else if (c.name === 'Age Band') sampleRow[c.name] = '35-44';
    else if (c.name === 'Gender') sampleRow[c.name] = 'Female';
    else if (c.name === 'UK Nation') sampleRow[c.name] = 'England';
    else if (c.name === 'City') sampleRow[c.name] = 'London';
    else if (c.name === 'Acquisition Channel') sampleRow[c.name] = 'Online Direct';
    else if (c.name === 'Join Date') sampleRow[c.name] = '15/04/2024';
    else if (c.name === 'Tenure Months') sampleRow[c.name] = 30;
    else if (c.name === 'Service Type') sampleRow[c.name] = 'Fibre Broadband';
    else if (c.name === 'Plan Name') sampleRow[c.name] = 'Ultra Fibre 500';
    else if (c.name === 'Contract Type') sampleRow[c.name] = '24 Month';
    else if (c.name === 'Contract Start Date') sampleRow[c.name] = '15/04/2024';
    else if (c.name === 'Contract End Date') sampleRow[c.name] = '15/04/2026';
    else if (c.name === 'Auto Renew') sampleRow[c.name] = 'Yes';
    else if (c.name === 'Monthly Charge GBP') sampleRow[c.name] = 39.99;
    else if (c.name === 'Average Monthly Usage GB') sampleRow[c.name] = 340.5;
    else if (c.name === 'Data Allowance GB') sampleRow[c.name] = 500;
    else if (c.name === 'Overage Charges GBP') sampleRow[c.name] = 0.00;
    else if (c.name === 'Discount Percent') sampleRow[c.name] = 10.0;
    else if (c.name === 'Payment Method') sampleRow[c.name] = 'Direct Debit';
    else if (c.name === 'Direct Debit') sampleRow[c.name] = 'Yes';
    else if (c.name === 'Late Payments 12M') sampleRow[c.name] = 0;
    else if (c.name === 'Failed Payments 12M') sampleRow[c.name] = 0;
    else if (c.name === 'Support Tickets 12M') sampleRow[c.name] = 1;
    else if (c.name === 'Complaints 12M') sampleRow[c.name] = 0;
    else if (c.name === 'Average Resolution Hours') sampleRow[c.name] = 12.5;
    else if (c.name === 'Network Outages 12M') sampleRow[c.name] = 0;
    else if (c.name === 'Satisfaction Score 1 10') sampleRow[c.name] = 8;
    else if (c.name === 'NPS Score') sampleRow[c.name] = 9;
    else if (c.name === 'Competitor Offer Received') sampleRow[c.name] = 'No';
    else if (c.name === 'Churn Status') sampleRow[c.name] = 'Active';
    else if (c.name === 'Churn Date') sampleRow[c.name] = '';
    else if (c.name === 'Churn Reason') sampleRow[c.name] = '';
    else if (c.name === 'Lifetime Revenue GBP') sampleRow[c.name] = 1199.70;
    else if (c.name === 'Monthly Revenue At Risk GBP') sampleRow[c.name] = 35.99;
    else if (c.name === 'Churn Flag') sampleRow[c.name] = 0;
    else sampleRow[c.name] = '';
  });

  const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BritConnect_Template');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

/**
 * Generate Data Dictionary CSV string for download
 */
export function generateDataDictionaryCsv(): string {
  const lines = ['"No.","Column Name","Data Type","Description","Required","Validation Rules"'];
  AUTHORITATIVE_COLUMNS.forEach(c => {
    let rules = '';
    if (c.allowedValues) rules += `Allowed: [${c.allowedValues.join(', ')}]. `;
    if (c.min !== undefined) rules += `Min: ${c.min}. `;
    if (c.max !== undefined) rules += `Max: ${c.max}. `;
    if (c.isLeakageTarget) rules += `Model Target/Leakage Excluded. `;
    lines.push(`"${c.colNumber}","${c.name}","${c.type}","${c.description.replace(/"/g, '""')}","${c.required ? 'Yes' : 'No'}","${rules.trim()}"`);
  });
  return lines.join('\n');
}
