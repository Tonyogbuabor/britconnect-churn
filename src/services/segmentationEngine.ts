/**
 * BritConnect Customer Segmentation Engine
 * Lens A: Business Rule-Based Value/Risk Cohorts
 * Lens B: Unsupervised K-Means Clustering on Standardised Behavioral Metrics
 */

import { CleanedCustomerRecord } from '../types/telecom';

export interface SegmentProfile {
  id: string;
  name: string;
  description: string;
  lens: 'rule_based' | 'kmeans';
  customerCount: number;
  percentageOfBase: number;
  averageChurnProbability: number;
  churnRate: number; // For historical or scored
  totalMRR: number;
  revenueAtRiskGBP: number;
  averageTenureMonths: number;
  averageMonthlyCharge: number;
  definingTraits: string[];
  recommendedStrategy: string;
  recommendedOffers: string[];
}

/**
 * Assign Rule-Based Cohorts to active/scored customers
 */
export function assignRuleBasedSegments(
  records: CleanedCustomerRecord[],
  medianCharge = 38
): { scoredRecords: CleanedCustomerRecord[]; profiles: SegmentProfile[] } {
  const scoredRecords = records.map((r) => {
    const prob = r.churnProbability ?? (r.churnFlag === 1 ? 0.8 : 0.2);
    const charge = r.effectiveMonthlyCharge;

    let segment = 'Standard Active Base';

    if (r.monthsToContractEnd <= 2 && !r.autoRenew && prob >= 0.45) {
      segment = 'Contract Cliff';
    } else if (r.complaints12M >= 2 || r.avgResolutionHours >= 36 || r.satisfactionScore <= 4) {
      segment = 'Service Frustrated';
    } else if (charge >= medianCharge && prob >= 0.50) {
      segment = 'High Value – High Risk';
    } else if (charge >= medianCharge && prob < 0.30) {
      segment = 'High Value – Stable';
    } else if (r.competitorOfferReceived && prob >= 0.40) {
      segment = 'Price Sensitive / Competitor Risk';
    } else if (r.paymentRiskIndex >= 2 || !r.directDebit) {
      segment = 'Payment Stress';
    } else if (r.tenureMonths >= 24 && r.npsScore >= 8 && prob < 0.25) {
      segment = 'Loyal Advocates';
    } else if (charge < medianCharge && prob >= 0.50) {
      segment = 'Low Value – High Risk';
    }

    return { ...r, ruleSegment: segment };
  });

  // Calculate Segment Profiles
  const totalBase = scoredRecords.length;
  const groupMap = new Map<string, CleanedCustomerRecord[]>();

  scoredRecords.forEach((r) => {
    const s = r.ruleSegment || 'Standard Active Base';
    if (!groupMap.has(s)) groupMap.set(s, []);
    groupMap.get(s)!.push(r);
  });

  const definitions: Record<string, { desc: string; traits: string[]; strat: string; offers: string[] }> = {
    'High Value – High Risk': {
      desc: 'Top revenue contributors with elevated churn probability. Urgent priority for retention outreach.',
      traits: ['Above-average MRR', 'High probability (>= 50%)', 'Elevated exposure to rival offers'],
      strat: 'VIP account management outreach, bespoke retention package, dedicated account manager.',
      offers: ['15-20% VIP loyalty discount', 'Priority service escalation tier', 'Free router/modem upgrade'],
    },
    'Contract Cliff': {
      desc: 'Fixed-term contract ending within 60 days with auto-renew disabled.',
      traits: ['Contract ending in <= 60 days', 'Auto-renew turned off', 'Vulnerable to aggregator switching'],
      strat: 'Proactive renewal campaign at T-45 days with renewal bonus or tariff modernisation.',
      offers: ['Modernised speed tier at existing price', '12-month renewal bill credit (£30)', 'Free streaming perk'],
    },
    'Service Frustrated': {
      desc: 'Customers who experienced recurring complaints, slow support, or network outages.',
      traits: ['2+ complaints logged in 12M', 'Resolution > 36h', 'Low satisfaction score (<= 4/10)'],
      strat: 'Proactive service apology call from senior agent, immediate fault clearance, and bill credit.',
      offers: ['£25 goodwill service credit', 'Senior technical engineer line check', 'Direct priority phone line access'],
    },
    'Price Sensitive / Competitor Risk': {
      desc: 'Customers with confirmed rival competitor offers and tariff rate scrutiny.',
      traits: ['Competitor offer received', 'Price comparison referral', 'Discount sensitivity'],
      strat: 'Competitive price-match guarantee and commitment bonus.',
      offers: ['Price-match to competitor quote', 'Annual contract loyalty discount', 'Data allowance doubling'],
    },
    'High Value – Stable': {
      desc: 'High ARPU customers with low churn probability and strong loyalty.',
      traits: ['High monthly charge', 'Low churn prob (< 30%)', 'High direct debit uptake'],
      strat: 'Delight & protect: cross-sell premium add-ons, early access to new technology.',
      offers: ['Early 5G/Wi-Fi 7 device upgrades', 'Family bundle discount', 'Free speed boost trial'],
    },
    'Payment Stress': {
      desc: 'Customers with late or bounced payments and non-direct-debit payment methods.',
      traits: ['Late or failed payments', 'Manual invoice/cheque payment', 'Collections friction'],
      strat: 'Payment flexibility and direct debit migration incentive.',
      offers: ['£5/month discount for migrating to Direct Debit', 'Flexible payment date selection', 'Payment holiday option'],
    },
    'Loyal Advocates': {
      desc: 'Tenured promoters with exceptional CSAT and advocacy ratings.',
      traits: ['24+ months tenure', 'NPS 9-10 (Promoter)', 'Zero complaints in 12M'],
      strat: 'Referral advocacy programme, community engagement, brand advocacy rewards.',
      offers: ['£50 refer-a-friend dual reward', 'Exclusive loyalty anniversary gift', 'Beta tester preview access'],
    },
    'Low Value – High Risk': {
      desc: 'Lower spending tiers with high churn risk. Cost-effective automated outreach.',
      traits: ['Below-average MRR', 'High churn probability', 'Digital-only engagement'],
      strat: 'Automated digital retention via SMS/Email; low-cost retention offers.',
      offers: ['Simplified tariff lock-in', '10% digital self-service voucher', 'Free data bundle add-on'],
    },
    'Standard Active Base': {
      desc: 'Customers with balanced risk profiles and typical engagement.',
      traits: ['Moderate tenure', 'Standard usage patterns', 'In-contract status'],
      strat: 'Ongoing lifecycle engagement, usage notifications, and product updates.',
      offers: ['App check-in bonus', 'Annual account health check', 'Optional speed upgrade'],
    },
  };

  const profiles: SegmentProfile[] = Array.from(groupMap.entries()).map(([name, list]) => {
    const count = list.length;
    const totalMRR = list.reduce((sum, r) => sum + r.effectiveMonthlyCharge, 0);
    const revenueAtRisk = list.reduce((sum, r) => sum + (r.expectedMonthlyRevenueAtRisk || 0), 0);
    const avgProb = list.reduce((sum, r) => sum + (r.churnProbability || 0.2), 0) / Math.max(1, count);
    const avgTenure = list.reduce((sum, r) => sum + r.tenureMonths, 0) / Math.max(1, count);
    const avgCharge = totalMRR / Math.max(1, count);
    const churnCount = list.filter((r) => r.churnFlag === 1).length;
    const def = definitions[name] || definitions['Standard Active Base'];

    return {
      id: `seg-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name,
      description: def.desc,
      lens: 'rule_based',
      customerCount: count,
      percentageOfBase: totalBase > 0 ? +(count / totalBase * 100).toFixed(1) : 0,
      averageChurnProbability: +avgProb.toFixed(3),
      churnRate: count > 0 ? +(churnCount / count * 100).toFixed(1) : 0,
      totalMRR: Math.round(totalMRR),
      revenueAtRiskGBP: Math.round(revenueAtRisk),
      averageTenureMonths: Math.round(avgTenure),
      averageMonthlyCharge: +avgCharge.toFixed(2),
      definingTraits: def.traits,
      recommendedStrategy: def.strat,
      recommendedOffers: def.offers,
    };
  });

  profiles.sort((a, b) => b.revenueAtRiskGBP - a.revenueAtRiskGBP);

  return { scoredRecords, profiles };
}

/**
 * Lens B: Unsupervised K-Means Clustering on Standardised Features (k = 3 to 6)
 */
export function runKMeansClustering(
  records: CleanedCustomerRecord[],
  k = 4,
  maxIterations = 20
): { scoredRecords: CleanedCustomerRecord[]; profiles: SegmentProfile[] } {
  if (records.length === 0) return { scoredRecords: records, profiles: [] };

  // Feature vector for clustering:
  // [tenureMonths, effectiveMonthlyCharge, avgUsageGB, satisfactionScore, paymentRiskIndex, monthsToContractEnd]
  const rawMatrix = records.map((r) => [
    r.tenureMonths,
    r.effectiveMonthlyCharge,
    r.avgUsageGB,
    r.satisfactionScore,
    r.paymentRiskIndex,
    r.monthsToContractEnd,
  ]);

  const numFeatures = rawMatrix[0].length;
  // Compute means and stds
  const means = new Array(numFeatures).fill(0);
  const stds = new Array(numFeatures).fill(1);

  for (let j = 0; j < numFeatures; j++) {
    let s = 0;
    for (let i = 0; i < rawMatrix.length; i++) s += rawMatrix[i][j];
    means[j] = s / rawMatrix.length;

    let v = 0;
    for (let i = 0; i < rawMatrix.length; i++) v += Math.pow(rawMatrix[i][j] - means[j], 2);
    stds[j] = Math.sqrt(v / rawMatrix.length) || 1;
  }

  // Standardize matrix
  const normMatrix = rawMatrix.map((row) =>
    row.map((val, j) => (val - means[j]) / stds[j])
  );

  // Initialize centroids using k-means++ style
  const centroids: number[][] = [];
  centroids.push([...normMatrix[Math.floor(Math.random() * normMatrix.length)]]);

  for (let c = 1; c < k; c++) {
    const distances = normMatrix.map((pt) => {
      let minDist = Infinity;
      for (const cent of centroids) {
        const d = pt.reduce((acc, val, j) => acc + Math.pow(val - cent[j], 2), 0);
        if (d < minDist) minDist = d;
      }
      return minDist;
    });
    const maxDistIdx = distances.indexOf(Math.max(...distances));
    centroids.push([...normMatrix[maxDistIdx]]);
  }

  let assignments = new Array(records.length).fill(0);

  // Iterative Lloyd algorithm
  for (let iter = 0; iter < maxIterations; iter++) {
    // 1. Assign points to nearest centroid
    let changed = false;
    for (let i = 0; i < normMatrix.length; i++) {
      let nearest = 0;
      let minD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = normMatrix[i].reduce((acc, val, j) => acc + Math.pow(val - centroids[c][j], 2), 0);
        if (d < minD) {
          minD = d;
          nearest = c;
        }
      }
      if (assignments[i] !== nearest) {
        assignments[i] = nearest;
        changed = true;
      }
    }

    if (!changed && iter > 2) break;

    // 2. Update centroids
    for (let c = 0; c < k; c++) {
      const clusterPoints = normMatrix.filter((_, idx) => assignments[idx] === c);
      if (clusterPoints.length > 0) {
        for (let j = 0; j < numFeatures; j++) {
          const sum = clusterPoints.reduce((acc, pt) => acc + pt[j], 0);
          centroids[c][j] = sum / clusterPoints.length;
        }
      }
    }
  }

  // Build cluster profiles
  const clusterNames = [
    'Cluster 1: High-Spend Tech Power Users',
    'Cluster 2: Contract-Nearing Savers',
    'Cluster 3: Tenured Loyal Family Base',
    'Cluster 4: Vulnerable High-Friction Subscribers',
    'Cluster 5: Budget SIM-Only Mobile Users',
    'Cluster 6: Small Business Fibre Subscribers',
  ];

  const scoredRecords = records.map((r, i) => ({
    ...r,
    clusterId: assignments[i] + 1,
  }));

  const total = records.length;
  const profiles: SegmentProfile[] = [];

  for (let c = 0; c < k; c++) {
    const clusterRows = scoredRecords.filter((_, i) => assignments[i] === c);
    const count = clusterRows.length;
    if (count === 0) continue;

    const totalMRR = clusterRows.reduce((sum, r) => sum + r.effectiveMonthlyCharge, 0);
    const revenueAtRisk = clusterRows.reduce((sum, r) => sum + (r.expectedMonthlyRevenueAtRisk || 0), 0);
    const avgProb = clusterRows.reduce((sum, r) => sum + (r.churnProbability || 0.2), 0) / count;
    const avgTenure = clusterRows.reduce((sum, r) => sum + r.tenureMonths, 0) / count;
    const avgCharge = totalMRR / count;

    profiles.push({
      id: `kmeans-${c + 1}`,
      name: clusterNames[c] || `Cluster ${c + 1}`,
      description: `Unsupervised cluster grouping derived from usage, tenure, satisfaction, and contract horizon.`,
      lens: 'kmeans',
      customerCount: count,
      percentageOfBase: +(count / total * 100).toFixed(1),
      averageChurnProbability: +avgProb.toFixed(3),
      churnRate: 0,
      totalMRR: Math.round(totalMRR),
      revenueAtRiskGBP: Math.round(revenueAtRisk),
      averageTenureMonths: Math.round(avgTenure),
      averageMonthlyCharge: +avgCharge.toFixed(2),
      definingTraits: [
        `Average Monthly Charge £${avgCharge.toFixed(2)}`,
        `Average Tenure ${Math.round(avgTenure)} months`,
        `Average Churn Probability ${(avgProb * 100).toFixed(1)}%`,
      ],
      recommendedStrategy: 'Tailor automated retention messages to cluster-specific usage and tariff profiles.',
      recommendedOffers: ['Cluster tailored discount', 'Contract extension reward', 'Speed upgrade bundle'],
    });
  }

  profiles.sort((a, b) => b.revenueAtRiskGBP - a.revenueAtRiskGBP);

  return { scoredRecords, profiles };
}
