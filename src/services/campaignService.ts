/**
 * BritConnect Retention Campaign Management & Incremental Uplift Analytics
 * Stratified holdout control groups, two-proportion z-test significance, ROI & Payback calculations
 */

import { CampaignRecord, CleanedCustomerRecord } from '../types/telecom';

// Normal CDF approximation for two-proportion z-test p-values
function normalCdf(z: number): number {
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (z >= 0) {
    const t = 1.0 / (1.0 + p * z);
    return 1.0 - c * Math.exp((-z * z) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * z);
    return c * Math.exp((-z * z) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

/**
 * Perform two-proportion z-test for incremental retention uplift
 */
export function computeUpliftSignificance(
  treatedSaves: number,
  treatedTotal: number,
  controlSaves: number,
  controlTotal: number
): {
  upliftPercentagePoints: number;
  treatedRate: number;
  controlRate: number;
  zScore: number;
  pValue: number;
  confInterval95: [number, number];
} {
  if (treatedTotal === 0 || controlTotal === 0) {
    return {
      upliftPercentagePoints: 0,
      treatedRate: 0,
      controlRate: 0,
      zScore: 0,
      pValue: 1.0,
      confInterval95: [0, 0],
    };
  }

  const p1 = treatedSaves / treatedTotal;
  const p2 = controlSaves / controlTotal;
  const diff = p1 - p2;

  // Pooled proportion
  const pPool = (treatedSaves + controlSaves) / (treatedTotal + controlTotal);
  const sePool = Math.sqrt(pPool * (1 - pPool) * (1 / treatedTotal + 1 / controlTotal)) || 1e-6;

  const zScore = diff / sePool;
  // Two-tailed p-value
  const pValue = +(2 * (1 - normalCdf(Math.abs(zScore)))).toFixed(4);

  // Standard error for confidence interval (unpooled)
  const seDiff = Math.sqrt((p1 * (1 - p1)) / treatedTotal + (p2 * (1 - p2)) / controlTotal) || 1e-6;
  const margin = 1.96 * seDiff;

  const ciLow = +((diff - margin) * 100).toFixed(2);
  const ciHigh = +((diff + margin) * 100).toFixed(2);

  return {
    upliftPercentagePoints: +(diff * 100).toFixed(2),
    treatedRate: +(p1 * 100).toFixed(2),
    controlRate: +(p2 * 100).toFixed(2),
    zScore: +zScore.toFixed(3),
    pValue,
    confInterval95: [ciLow, ciHigh],
  };
}

/**
 * Create a new Campaign record with stratified control holdout assignment
 */
export function createCampaignWithHoldout(
  name: string,
  objective: string,
  offerType: CampaignRecord['offerType'],
  channel: CampaignRecord['channel'],
  targetCriteria: CampaignRecord['targetCriteria'],
  targetedCustomers: CleanedCustomerRecord[],
  budgetGBP: number,
  costPerContactGBP: number,
  offerCostPerAcceptGBP: number,
  owner: string,
  controlGroupPercentage = 15
): {
  campaign: CampaignRecord;
  treatedCustomerIds: string[];
  controlCustomerIds: string[];
} {
  const id = `cmp-${Date.now()}`;
  const totalCount = targetedCustomers.length;
  const holdoutSeed = Math.floor(Math.random() * 100000);

  // Stratify by risk tier or probability into Treated and Holdout Control
  const treatedIds: string[] = [];
  const controlIds: string[] = [];

  const tierBuckets: Record<string, CleanedCustomerRecord[]> = {
    Critical: [],
    High: [],
    Medium: [],
    Low: [],
  };

  targetedCustomers.forEach((c) => {
    const tier = c.riskTier || 'Medium';
    tierBuckets[tier]?.push(c);
  });

  const holdoutRatio = controlGroupPercentage / 100;

  Object.values(tierBuckets).forEach((bucket) => {
    const shuffled = [...bucket].sort(() => Math.random() - 0.5);
    const controlCount = Math.round(shuffled.length * holdoutRatio);
    shuffled.slice(0, controlCount).forEach((c) => controlIds.push(c.id));
    shuffled.slice(controlCount).forEach((c) => treatedIds.push(c.id));
  });

  const campaign: CampaignRecord = {
    id,
    name,
    objective,
    targetCriteria,
    offerType,
    channel,
    status: 'Planned',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    budgetGBP,
    costPerContactGBP,
    offerCostPerAcceptGBP,
    owner,
    controlGroupPercentage,
    holdoutSeed,
    customerCount: totalCount,
    contactedCount: 0,
    respondedCount: 0,
    acceptedCount: 0,
    treatedSaves: 0,
    controlSaves: 0,
    treatedRetentionRate: 0,
    controlRetentionRate: 0,
    upliftPercentagePoints: 0,
    upliftPValue: 1.0,
    upliftConfInterval95: [0, 0],
    retainedRevenueGBP: 0,
    totalCostGBP: 0,
    netROI: 0,
    costPerSaveGBP: 0,
    paybackPeriodMonths: 0,
    outcomesLoaded: false,
  };

  return { campaign, treatedCustomerIds: treatedIds, controlCustomerIds: controlIds };
}

/**
 * Record or simulate campaign execution outcomes
 */
export function updateCampaignOutcomes(
  campaign: CampaignRecord,
  contactedCount: number,
  respondedCount: number,
  acceptedCount: number,
  treatedSaves: number,
  controlSaves: number,
  avgCustomerMonthlyCharge = 42
): CampaignRecord {
  const treatedTotal = Math.max(1, campaign.customerCount - Math.round(campaign.customerCount * (campaign.controlGroupPercentage / 100)));
  const controlTotal = Math.max(1, campaign.customerCount - treatedTotal);

  const stats = computeUpliftSignificance(treatedSaves, treatedTotal, controlSaves, controlTotal);

  // Financial calculations
  const totalCostGBP = contactedCount * campaign.costPerContactGBP + acceptedCount * campaign.offerCostPerAcceptGBP;
  const incrementalSaves = Math.max(0, treatedSaves - Math.round(treatedTotal * (stats.controlRate / 100)));
  const retainedRevenueGBP = +(incrementalSaves * avgCustomerMonthlyCharge * 12).toFixed(2);
  const netROI = totalCostGBP > 0 ? +((retainedRevenueGBP - totalCostGBP) / totalCostGBP).toFixed(2) : 0;
  const costPerSaveGBP = incrementalSaves > 0 ? +(totalCostGBP / incrementalSaves).toFixed(2) : 0;
  const paybackPeriodMonths = retainedRevenueGBP > 0 ? +((totalCostGBP / (retainedRevenueGBP / 12))).toFixed(1) : 0;

  return {
    ...campaign,
    status: 'Completed',
    contactedCount,
    respondedCount,
    acceptedCount,
    treatedSaves,
    controlSaves,
    treatedRetentionRate: stats.treatedRate,
    controlRetentionRate: stats.controlRate,
    upliftPercentagePoints: stats.upliftPercentagePoints,
    upliftPValue: stats.pValue,
    upliftConfInterval95: stats.confInterval95,
    retainedRevenueGBP,
    totalCostGBP,
    netROI,
    costPerSaveGBP,
    paybackPeriodMonths,
    outcomesLoaded: true,
  };
}
