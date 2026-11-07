/**
 * BritConnect Customer Scoring & What-If Simulator Engine
 */

import {
  CleanedCustomerRecord,
  TrainedModelSummary,
  RiskTier,
  BusinessAssumptions,
} from '../types/telecom';
import {
  encodeRecord,
  standardizeVector,
  EncodingSchema,
} from './featureEngineering';
import {
  predictLogisticProbs,
  predictRandomForestProbs,
  predictGradientBoostingProbs,
  explainCustomerRisk,
} from './mlEngine';

/**
 * Score a list of customer records with a trained model
 */
export function scoreCustomers(
  records: CleanedCustomerRecord[],
  model: TrainedModelSummary,
  assumptions: BusinessAssumptions
): CleanedCustomerRecord[] {
  const schema = model.serializedModel?.schema as EncodingSchema;
  if (!schema) return records;

  // Encode records
  const rawMatrix = records.map((r) => encodeRecord(r, schema.featureNames, schema.categoricalMaps));
  const stdMatrix = rawMatrix.map((vec) => standardizeVector(vec, schema.means, schema.stds));

  // Predict probabilities according to model algorithm
  let rawProbs: number[] = [];
  if (model.algorithm === 'Logistic Regression') {
    rawProbs = predictLogisticProbs(model.serializedModel.model, stdMatrix);
  } else if (model.algorithm === 'Random Forest') {
    rawProbs = predictRandomForestProbs(model.serializedModel.model, stdMatrix);
  } else if (model.algorithm === 'Gradient Boosted Trees') {
    rawProbs = predictGradientBoostingProbs(model.serializedModel.model, stdMatrix);
  } else {
    // Default fallback
    rawProbs = records.map((r) => (r.churnFlag === 1 ? 0.85 : 0.15));
  }

  // Calculate percentiles across active cohort
  const indexed = rawProbs.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const percentiles = new Array(records.length).fill(50);
  indexed.forEach((item, rank) => {
    percentiles[item.i] = Math.round((rank / Math.max(1, records.length - 1)) * 100);
  });

  return records.map((r, i) => {
    const churnProbability = +rawProbs[i].toFixed(3);

    // Risk tier assignment
    let riskTier: RiskTier = 'Low';
    if (churnProbability >= assumptions.criticalRiskCutoff) riskTier = 'Critical';
    else if (churnProbability >= assumptions.highRiskCutoff) riskTier = 'High';
    else if (churnProbability >= assumptions.mediumRiskCutoff) riskTier = 'Medium';

    const expectedMonthlyRevenueAtRisk = +(churnProbability * r.effectiveMonthlyCharge).toFixed(2);
    const expectedLoss12M = +(expectedMonthlyRevenueAtRisk * assumptions.planningHorizonMonths).toFixed(2);
    const topDrivers = explainCustomerRisk(r, model);

    return {
      ...r,
      churnProbability,
      riskTier,
      riskPercentile: percentiles[i],
      expectedMonthlyRevenueAtRisk,
      expectedLoss12M,
      topDrivers: topDrivers.slice(0, 3),
    };
  });
}

export interface WhatIfLevers {
  discountPercent?: number; // e.g. 15%
  contractType?: string; // '12 Month' | '24 Month'
  extendContractMonths?: number; // e.g. 12
  resolveComplaints?: boolean;
  resolveOutages?: boolean;
  upgradeDataAllowance?: boolean;
  autoRenewToggle?: boolean;
}

/**
 * Re-score an individual customer under simulated what-if condition changes
 */
export function simulateCustomerWhatIf(
  originalCustomer: CleanedCustomerRecord,
  model: TrainedModelSummary,
  levers: WhatIfLevers,
  assumptions: BusinessAssumptions
): {
  simulatedCustomer: CleanedCustomerRecord;
  baselineProbability: number;
  simulatedProbability: number;
  probabilityDelta: number; // e.g. -0.25 (-25 pts)
  baselineExpectedMonthlyLoss: number;
  simulatedExpectedMonthlyLoss: number;
  monthlyRevenueSaved: number;
  annual12MSaved: number;
} {
  const modified: CleanedCustomerRecord = { ...originalCustomer };

  if (levers.discountPercent !== undefined) {
    modified.discountPercent = levers.discountPercent;
    modified.effectiveMonthlyCharge = +(modified.monthlyCharge * (1 - modified.discountPercent / 100)).toFixed(2);
  }

  if (levers.extendContractMonths && levers.extendContractMonths > 0) {
    modified.monthsToContractEnd += levers.extendContractMonths;
    modified.contractExpiring30Days = 0;
    modified.contractExpiring60Days = 0;
    modified.contractExpiring90Days = 0;
    modified.contractStage = 'In-Term';
  }

  if (levers.contractType) {
    modified.contractType = levers.contractType;
  }

  if (levers.autoRenewToggle !== undefined) {
    modified.autoRenew = levers.autoRenewToggle;
  }

  if (levers.resolveComplaints) {
    modified.complaints12M = 0;
    modified.avgResolutionHours = 4.0;
    modified.satisfactionScore = Math.min(10, modified.satisfactionScore + 2);
    modified.experienceIndex = Math.max(0, modified.experienceIndex - 3.5);
  }

  if (levers.resolveOutages) {
    modified.networkOutages12M = 0;
    modified.experienceIndex = Math.max(0, modified.experienceIndex - 2.0);
  }

  if (levers.upgradeDataAllowance) {
    modified.dataAllowanceGB = Math.max(modified.dataAllowanceGB, modified.avgUsageGB * 1.5);
    modified.overageCharges = 0;
    modified.overAllowanceFlag = 0;
  }

  // Re-score the single modified customer
  const scoredList = scoreCustomers([modified], model, assumptions);
  const simulatedCustomer = scoredList[0];

  const baselineProbability = originalCustomer.churnProbability ?? 0.5;
  const simulatedProbability = simulatedCustomer.churnProbability ?? 0.5;
  const probabilityDelta = +(simulatedProbability - baselineProbability).toFixed(3);

  const baselineExpectedMonthlyLoss = +(baselineProbability * originalCustomer.effectiveMonthlyCharge).toFixed(2);
  const simulatedExpectedMonthlyLoss = +(simulatedProbability * simulatedCustomer.effectiveMonthlyCharge).toFixed(2);

  const monthlyRevenueSaved = Math.max(0, +(baselineExpectedMonthlyLoss - simulatedExpectedMonthlyLoss).toFixed(2));
  const annual12MSaved = +(monthlyRevenueSaved * assumptions.planningHorizonMonths).toFixed(2);

  return {
    simulatedCustomer,
    baselineProbability,
    simulatedProbability,
    probabilityDelta,
    baselineExpectedMonthlyLoss,
    simulatedExpectedMonthlyLoss,
    monthlyRevenueSaved,
    annual12MSaved,
  };
}
