/**
 * High-Fidelity Synthetic UK Telecom Dataset Generator for BritConnect
 * Generates 1,000 realistic customer rows matching all 38 columns with
 * realistic correlations between churn, contract expiration, complaints, and competitor offers.
 */

import { RawCustomerRecord } from '../types/telecom';

const CITIES: { name: string; nation: string }[] = [
  { name: 'London', nation: 'England' },
  { name: 'Manchester', nation: 'England' },
  { name: 'Birmingham', nation: 'England' },
  { name: 'Leeds', nation: 'England' },
  { name: 'Bristol', nation: 'England' },
  { name: 'Newcastle', nation: 'England' },
  { name: 'Edinburgh', nation: 'Scotland' },
  { name: 'Glasgow', nation: 'Scotland' },
  { name: 'Aberdeen', nation: 'Scotland' },
  { name: 'Cardiff', nation: 'Wales' },
  { name: 'Swansea', nation: 'Wales' },
  { name: 'Belfast', nation: 'Northern Ireland' },
  { name: 'Derry', nation: 'Northern Ireland' },
];

const SERVICE_PLANS: { service: string; plan: string; charge: number; allowance: number }[] = [
  { service: 'Fibre Broadband', plan: 'Fibre Essential 65', charge: 29.99, allowance: 1000 },
  { service: 'Fibre Broadband', plan: 'Ultra Fibre 500', charge: 44.99, allowance: 2000 },
  { service: 'Fibre Broadband', plan: 'Gigabit Pro 1000', charge: 59.99, allowance: 5000 },
  { service: 'Standard Broadband', plan: 'Basic Connect 20', charge: 22.50, allowance: 250 },
  { service: 'Mobile SIM-Only', plan: 'SIM 20GB Unlimited Talk', charge: 14.00, allowance: 20 },
  { service: 'Mobile SIM-Only', plan: 'SIM 100GB 5G Flex', charge: 22.00, allowance: 100 },
  { service: 'Mobile Device Contract', plan: 'iPhone 15 Pro 5G 100GB', charge: 58.00, allowance: 100 },
  { service: 'Mobile Device Contract', plan: 'Galaxy S24 Ultra 5G Unlimited', charge: 62.00, allowance: 1000 },
  { service: 'Triple Play Bundle', plan: 'Home Complete (Fibre + TV + Mobile)', charge: 79.99, allowance: 2500 },
];

const CHANNELS = ['Online Direct', 'Retail Store', 'Price Comparison Website', 'Telesales', 'Referral / Word of Mouth'];
const CONTRACT_TYPES = ['12 Month', '24 Month', '36 Month', 'Rolling 30-Day'];
const PAYMENT_METHODS = ['Direct Debit', 'Credit Card', 'Debit Card', 'Bank Transfer'];

const CHURN_REASONS = [
  'Price Increase / Found Cheaper Competitor',
  'Poor Broadband Reliability / Frequent Outages',
  'Slow Customer Service & Unresolved Complaints',
  'Moving Home to Non-Service Area',
  'Contract Expired - Switcher Incentive',
  'Poor Mobile Coverage / Dropped Calls',
];

// Seeded pseudorandom generator for deterministic reproducibility
function createRng(seed = 42) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateBritConnectSampleDataset(count = 1000, seed = 2026): RawCustomerRecord[] {
  const rng = createRng(seed);
  const records: RawCustomerRecord[] = [];
  const referenceDate = new Date('2026-11-07');

  for (let i = 1; i <= count; i++) {
    const custId = `BC-${String(i).padStart(6, '0')}`;
    const isSmallBusiness = rng() < 0.22;
    const segment = isSmallBusiness ? 'Small Business' : 'Consumer';

    const age = Math.floor(19 + rng() * 66);
    let ageBand = '18-24';
    if (age >= 25 && age <= 34) ageBand = '25-34';
    else if (age >= 35 && age <= 44) ageBand = '35-44';
    else if (age >= 45 && age <= 54) ageBand = '45-54';
    else if (age >= 55 && age <= 64) ageBand = '55-64';
    else if (age >= 65) ageBand = '65+';

    const genderRoll = rng();
    const gender = genderRoll < 0.49 ? 'Female' : genderRoll < 0.96 ? 'Male' : 'Non-Binary';

    const cityObj = CITIES[Math.floor(rng() * CITIES.length)];
    const channel = CHANNELS[Math.floor(rng() * CHANNELS.length)];

    // Tenure between 1 and 72 months
    const tenureMonths = Math.max(1, Math.floor(rng() * 68) + 1);
    const joinDateObj = new Date(referenceDate);
    joinDateObj.setMonth(joinDateObj.getMonth() - tenureMonths);
    const joinDateStr = `${String(joinDateObj.getDate()).padStart(2, '0')}/${String(joinDateObj.getMonth() + 1).padStart(2, '0')}/${joinDateObj.getFullYear()}`;

    const planObj = SERVICE_PLANS[Math.floor(rng() * SERVICE_PLANS.length)];
    const contractType = CONTRACT_TYPES[Math.floor(rng() * CONTRACT_TYPES.length)];

    const contractStartObj = new Date(joinDateObj);
    // Renewed at some point if long tenure
    if (tenureMonths > 24) {
      contractStartObj.setMonth(contractStartObj.getMonth() + 24);
    }
    const contractStartStr = `${String(contractStartObj.getDate()).padStart(2, '0')}/${String(contractStartObj.getMonth() + 1).padStart(2, '0')}/${contractStartObj.getFullYear()}`;

    // Contract end date calculation
    let contractTermMonths = 24;
    if (contractType === '12 Month') contractTermMonths = 12;
    else if (contractType === '36 Month') contractTermMonths = 36;
    else if (contractType === 'Rolling 30-Day') contractTermMonths = 1;

    const contractEndObj = new Date(contractStartObj);
    contractEndObj.setMonth(contractEndObj.getMonth() + contractTermMonths);
    const contractEndStr = `${String(contractEndObj.getDate()).padStart(2, '0')}/${String(contractEndObj.getMonth() + 1).padStart(2, '0')}/${contractEndObj.getFullYear()}`;

    const daysToExpiry = Math.round((contractEndObj.getTime() - referenceDate.getTime()) / (1000 * 3600 * 24));
    const autoRenew = rng() > (daysToExpiry < 30 ? 0.65 : 0.25) ? 'Yes' : 'No';

    const discountRoll = rng();
    const discountPercent = discountRoll < 0.5 ? 0 : discountRoll < 0.8 ? 10 : discountRoll < 0.95 ? 20 : 30;
    const monthlyChargeGBP = isSmallBusiness ? +(planObj.charge * 1.35).toFixed(2) : planObj.charge;

    // Usage & Allowance
    const usageRatio = 0.4 + rng() * 0.9;
    const avgUsageGB = +(planObj.allowance * usageRatio).toFixed(1);
    const overageChargesGBP = avgUsageGB > planObj.allowance ? +((avgUsageGB - planObj.allowance) * 1.5).toFixed(2) : 0.0;

    // Payment behaviour
    const paymentMethod = PAYMENT_METHODS[Math.floor(rng() * PAYMENT_METHODS.length)];
    const directDebit = paymentMethod === 'Direct Debit' ? 'Yes' : (rng() < 0.2 ? 'Yes' : 'No');
    const paymentRiskRoll = rng();
    const latePayments12M = paymentRiskRoll < 0.75 ? 0 : paymentRiskRoll < 0.92 ? 1 : Math.floor(rng() * 4) + 2;
    const failedPayments12M = latePayments12M === 0 ? 0 : (rng() < 0.5 ? 0 : 1);

    // Service experience & tickets
    const complaintRoll = rng();
    const complaints12M = complaintRoll < 0.7 ? 0 : complaintRoll < 0.88 ? 1 : complaintRoll < 0.96 ? 2 : Math.floor(rng() * 3) + 3;
    const supportTickets12M = complaints12M + Math.floor(rng() * 4);
    const avgResolutionHours = complaints12M > 0 ? +(16 + rng() * 48).toFixed(1) : +(4 + rng() * 14).toFixed(1);
    const networkOutages12M = rng() < 0.65 ? 0 : rng() < 0.9 ? 1 : Math.floor(rng() * 3) + 2;

    // Sentiment
    let satisfaction = Math.min(10, Math.max(1, Math.round(9 - (complaints12M * 1.8) - (networkOutages12M * 1.2) - (rng() * 2))));
    let nps = Math.min(10, Math.max(0, satisfaction - Math.floor(rng() * 3)));
    const competitorOffer = (satisfaction <= 5 || daysToExpiry < 60) ? (rng() < 0.65 ? 'Yes' : 'No') : (rng() < 0.15 ? 'Yes' : 'No');

    // Churn correlation score
    let churnScore = 0.08;
    if (daysToExpiry <= 30 && autoRenew === 'No') churnScore += 0.35;
    if (daysToExpiry <= 60 && autoRenew === 'No') churnScore += 0.18;
    if (complaints12M >= 2) churnScore += 0.28;
    if (satisfaction <= 4) churnScore += 0.25;
    if (competitorOffer === 'Yes') churnScore += 0.22;
    if (overageChargesGBP > 15) churnScore += 0.15;
    if (latePayments12M >= 2) churnScore += 0.18;
    if (networkOutages12M >= 2) churnScore += 0.16;
    if (tenureMonths <= 6) churnScore += 0.12;
    if (tenureMonths > 36) churnScore -= 0.12;
    if (satisfaction >= 8) churnScore -= 0.20;

    const isChurned = rng() < Math.max(0.04, Math.min(0.92, churnScore));
    const churnFlag = isChurned ? 1 : 0;
    const churnStatus = isChurned ? 'Churned' : 'Active';

    let churnDateStr = '';
    let churnReasonStr = '';
    if (isChurned) {
      const churnDateObj = new Date(referenceDate);
      churnDateObj.setDate(churnDateObj.getDate() - Math.floor(rng() * 180));
      churnDateStr = `${String(churnDateObj.getDate()).padStart(2, '0')}/${String(churnDateObj.getMonth() + 1).padStart(2, '0')}/${churnDateObj.getFullYear()}`;
      if (competitorOffer === 'Yes' && rng() < 0.6) {
        churnReasonStr = 'Price Increase / Found Cheaper Competitor';
      } else if (complaints12M > 0 || avgResolutionHours > 30) {
        churnReasonStr = 'Slow Customer Service & Unresolved Complaints';
      } else if (networkOutages12M > 1) {
        churnReasonStr = 'Poor Broadband Reliability / Frequent Outages';
      } else {
        churnReasonStr = CHURN_REASONS[Math.floor(rng() * CHURN_REASONS.length)];
      }
    }

    const effectiveCharge = +(monthlyChargeGBP * (1 - discountPercent / 100)).toFixed(2);
    const lifetimeRevenueGBP = +(effectiveCharge * tenureMonths).toFixed(2);
    const monthlyRevenueAtRiskGBP = isChurned ? 0 : +(effectiveCharge * (churnScore > 0.4 ? 1 : 0.5)).toFixed(2);

    records.push({
      'Customer ID': custId,
      'Customer Segment': segment,
      'Age': age,
      'Age Band': ageBand,
      'Gender': gender,
      'UK Nation': cityObj.nation,
      'City': cityObj.name,
      'Acquisition Channel': channel,
      'Join Date': joinDateStr,
      'Tenure Months': tenureMonths,
      'Service Type': planObj.service,
      'Plan Name': planObj.plan,
      'Contract Type': contractType,
      'Contract Start Date': contractStartStr,
      'Contract End Date': contractEndStr,
      'Auto Renew': autoRenew,
      'Monthly Charge GBP': monthlyChargeGBP,
      'Average Monthly Usage GB': avgUsageGB,
      'Data Allowance GB': planObj.allowance,
      'Overage Charges GBP': overageChargesGBP,
      'Discount Percent': discountPercent,
      'Payment Method': paymentMethod,
      'Direct Debit': directDebit,
      'Late Payments 12M': latePayments12M,
      'Failed Payments 12M': failedPayments12M,
      'Support Tickets 12M': supportTickets12M,
      'Complaints 12M': complaints12M,
      'Average Resolution Hours': avgResolutionHours,
      'Network Outages 12M': networkOutages12M,
      'Satisfaction Score 1 10': satisfaction,
      'NPS Score': nps,
      'Competitor Offer Received': competitorOffer,
      'Churn Status': churnStatus,
      'Churn Date': churnDateStr,
      'Churn Reason': churnReasonStr,
      'Lifetime Revenue GBP': lifetimeRevenueGBP,
      'Monthly Revenue At Risk GBP': monthlyRevenueAtRiskGBP,
      'Churn Flag': churnFlag,
    });
  }

  return records;
}
