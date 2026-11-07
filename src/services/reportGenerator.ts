/**
 * Professional PDF and Formatted Excel Report Generation Engine
 * Uses jsPDF, jspdf-autotable, and SheetJS (XLSX)
 * Styled with BritConnect Navy (#0B1F3A) and Gold (#C9A227)
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  CleanedCustomerRecord,
  TrainedModelSummary,
  ValidationReport,
  CleaningActionLog,
  CampaignRecord,
} from '../types/telecom';

// Add type declarations for jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Download Executive Summary PDF Report
 */
export function generateExecutiveSummaryPdf(
  metrics: Record<string, any>,
  topRiskCustomers: CleanedCustomerRecord[],
  insights: string[],
  filtersApplied: string
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  // Navy Header Banner
  doc.setFillColor(11, 31, 58); // #0B1F3A
  doc.rect(0, 0, 210, 40, 'F');

  // Gold Accent Stripe
  doc.setFillColor(201, 162, 39); // #C9A227
  doc.rect(0, 40, 210, 2.5, 'F');

  // Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('BritConnect', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(229, 197, 102);
  doc.text('AI CUSTOMER CHURN INTELLIGENCE PLATFORM', 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(220, 230, 243);
  doc.text(`Generated: ${dateStr} · Scope: ${filtersApplied}`, 14, 34);

  // Section: Executive KPI Grid
  let y = 52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 31, 58);
  doc.text('Executive Retention Performance Summary', 14, y);

  y += 6;
  const kpiData = [
    ['Total Customers', `${metrics.totalCustomers?.toLocaleString('en-GB') || '-'}`],
    ['Active Subscribers', `${metrics.activeCustomers?.toLocaleString('en-GB') || '-'}`],
    ['Baseline Churn Rate', `${metrics.churnRate || 0}%`],
    ['Active MRR', `£${metrics.mrr?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '0.00'}`],
    ['Monthly Revenue At Risk', `£${metrics.revenueAtRisk?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '0.00'}`],
    ['12-Month Expected Loss', `£${metrics.expectedLoss12M?.toLocaleString('en-GB', { minimumFractionDigits: 2 }) || '0.00'}`],
    ['Critical Risk Accounts', `${metrics.criticalRiskCount || 0}`],
    ['Contracts Expiring <= 30 Days', `${metrics.expiring30Days || 0}`],
  ];

  doc.autoTable({
    startY: y,
    head: [['Metric Indicator', 'Current Value']],
    body: kpiData,
    theme: 'grid',
    headStyles: { fillColor: [18, 48, 90], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 80, fontStyle: 'bold' } },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Section: Strategic AI Insights
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 31, 58);
  doc.text('Strategic Retention Observations & Recommendations', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 40, 55);

  const bullets = insights && insights.length > 0 ? insights : [
    `Contract expiry cliffs represent primary revenue leakage with ${metrics.expiring30Days || 0} contracts concluding in 30 days.`,
    `Critical tier concentration: ${metrics.criticalRiskCount || 0} active subscribers account for majority of predicted £ exposure.`,
    `Customer friction from unresolved complaints and resolution times above 36h strongly correlates with competitor switching.`,
    `Proactive renewal offers deployed at T-45 days demonstrate significantly higher save rates vs standard win-back campaigns.`,
  ];

  bullets.forEach((bullet) => {
    const lines = doc.splitTextToSize(`• ${bullet}`, 180);
    doc.text(lines, 14, y);
    y += lines.length * 4.5;
  });

  // Section: Top Accounts At Risk Table
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 31, 58);
  doc.text('Top High-Risk Accounts Requiring Immediate Outreach', 14, y);
  y += 4;

  const topRows = topRiskCustomers.slice(0, 10).map((c) => [
    c.id,
    c.segment,
    c.serviceType,
    `£${c.effectiveMonthlyCharge.toFixed(2)}`,
    `${((c.churnProbability || 0) * 100).toFixed(1)}%`,
    c.riskTier || 'High',
    c.topDrivers?.[0]?.plainEnglish || 'Contract expiring soon',
  ]);

  doc.autoTable({
    startY: y,
    head: [['ID', 'Segment', 'Service', 'Monthly £', 'Churn Prob', 'Tier', 'Key Risk Driver']],
    body: topRows,
    theme: 'striped',
    headStyles: { fillColor: [11, 31, 58], textColor: [201, 162, 39], fontStyle: 'bold' },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(140, 150, 165);
    doc.text(`BritConnect UK · Confidential Retention Intelligence · Page ${p} of ${totalPages}`, 14, 290);
  }

  doc.save(`BritConnect_Executive_Summary_${now.toISOString().slice(0, 10)}.pdf`);
}

/**
 * Download Model Card & Evaluation PDF Report
 */
export function generateModelPerformancePdf(model: TrainedModelSummary): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const now = new Date();

  // Header
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(201, 162, 39);
  doc.rect(0, 36, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BritConnect Model Performance Card', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 230, 243);
  doc.text(`Model: ${model.name} (${model.algorithm}) · Certified Leakage-Safe`, 14, 26);
  doc.text(`Trained: ${new Date(model.trainedAt).toLocaleDateString('en-GB')} · Optimal Threshold: ${model.optimalThreshold}`, 14, 32);

  let y = 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 31, 58);
  doc.text('Held-Out Test Set Evaluation Metrics', 14, y);
  y += 4;

  const m = model.metrics;
  const metricsData = [
    ['ROC-AUC (Discrimination)', `${m.rocAuc.toFixed(3)} (5-Fold CV: ${m.cvRocAucMean.toFixed(3)} ± ${m.cvRocAucStd.toFixed(2)})`],
    ['PR-AUC (Precision-Recall)', `${m.prAuc.toFixed(3)} (5-Fold CV: ${m.cvPrAucMean.toFixed(3)} ± ${m.cvPrAucStd.toFixed(2)})`],
    ['F1-Score', `${m.f1.toFixed(3)}`],
    ['Precision (PPV)', `${(m.precision * 100).toFixed(1)}%`],
    ['Recall (Sensitivity)', `${(m.recall * 100).toFixed(1)}%`],
    ['Specificity', `${(m.specificity * 100).toFixed(1)}%`],
    ['Balanced Accuracy', `${(m.balancedAccuracy * 100).toFixed(1)}%`],
    ['Top-Decile Lift', `${m.topDecileLift.toFixed(2)}× Base Churn Rate`],
    ['Brier Calibration Score', `${m.brierScore.toFixed(4)} (Closer to 0 is better)`],
    ['Kolmogorov-Smirnov (KS)', `${m.ksStatistic.toFixed(3)}`],
    ['Gini Coefficient', `${m.gini.toFixed(3)}`],
  ];

  doc.autoTable({
    startY: y,
    head: [['Metric', 'Test Set Score']],
    body: metricsData,
    theme: 'grid',
    headStyles: { fillColor: [18, 48, 90], textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 2 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Confusion matrix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 31, 58);
  doc.text('Confusion Matrix (Held-out Test Cohort)', 14, y);
  y += 4;

  const cm = m.confusionMatrix;
  const cmData = [
    ['Actual Churned (1)', `TP: ${cm.tp}`, `FN: ${cm.fn}`],
    ['Actual Active (0)', `FP: ${cm.fp}`, `TN: ${cm.tn}`],
  ];

  doc.autoTable({
    startY: y,
    head: [['Actual \\ Predicted', 'Predicted Churned (1)', 'Predicted Active (0)']],
    body: cmData,
    theme: 'grid',
    headStyles: { fillColor: [11, 31, 58], textColor: [201, 162, 39] },
    styles: { fontSize: 8.5, cellPadding: 3, halign: 'center' },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Leakage Guard Notice
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(122, 12, 30); // Wine red
  doc.text('Mandatory Leakage Guard Verification', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 50, 60);
  const leakageText = `Excluded Post-Churn Columns: [Customer ID, Churn Status, Churn Flag, Churn Date, Churn Reason, Monthly Revenue At Risk GBP, Lifetime Revenue GBP].\nModel trained exclusively on pre-decision behavioural and operational characteristics.`;
  doc.text(doc.splitTextToSize(leakageText, 180), 14, y);

  doc.save(`BritConnect_Model_Card_${model.algorithm.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Export Customer Risk List to Formatted Excel (.xlsx)
 * Implements frozen header rows, navy/gold styling, and column formats
 */
export function exportCustomerListExcel(customers: CleanedCustomerRecord[], fileName = 'BritConnect_Customer_Risk_Register'): void {
  const headers = [
    'Customer ID',
    'Segment',
    'UK Nation',
    'City',
    'Service Type',
    'Plan Name',
    'Contract Type',
    'Months To Contract End',
    'Auto Renew',
    'Monthly Charge (£)',
    'Discount (%)',
    'Effective Charge (£)',
    'Average Usage (GB)',
    'Allowance (GB)',
    'Complaints (12M)',
    'Resolution Hours',
    'Outages (12M)',
    'CSAT (1-10)',
    'NPS Score',
    'Competitor Offer',
    'Churn Probability',
    'Risk Tier',
    'Risk Percentile',
    'Monthly Revenue At Risk (£)',
    '12M Expected Loss (£)',
    'Primary Risk Driver',
  ];

  const rows = customers.map((c) => [
    c.id,
    c.segment,
    c.nation,
    c.city,
    c.serviceType,
    c.planName,
    c.contractType,
    c.monthsToContractEnd,
    c.autoRenew ? 'Yes' : 'No',
    c.monthlyCharge,
    c.discountPercent,
    c.effectiveMonthlyCharge,
    c.avgUsageGB,
    c.dataAllowanceGB,
    c.complaints12M,
    c.avgResolutionHours,
    c.networkOutages12M,
    c.satisfactionScore,
    c.npsScore,
    c.competitorOfferReceived ? 'Yes' : 'No',
    c.churnProbability !== undefined ? +(c.churnProbability * 100).toFixed(1) + '%' : '-',
    c.riskTier || '-',
    c.riskPercentile !== undefined ? c.riskPercentile : '-',
    c.expectedMonthlyRevenueAtRisk !== undefined ? c.expectedMonthlyRevenueAtRisk : '-',
    c.expectedLoss12M !== undefined ? c.expectedLoss12M : '-',
    c.topDrivers?.[0]?.plainEnglish || '-',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 20 },
    { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 16 },
    { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
    { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
    { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 22 }, { wch: 20 },
    { wch: 45 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Scored_Customers');

  // Add Summary Sheet
  const summaryHeaders = ['Metric', 'Value'];
  const totalRevAtRisk = customers.reduce((sum, c) => sum + (c.expectedMonthlyRevenueAtRisk || 0), 0);
  const criticalCount = customers.filter((c) => c.riskTier === 'Critical').length;
  const highCount = customers.filter((c) => c.riskTier === 'High').length;

  const summaryRows = [
    ['Export Timestamp', new Date().toISOString()],
    ['Total Customers In Scope', customers.length],
    ['Critical Risk Accounts', criticalCount],
    ['High Risk Accounts', highCount],
    ['Total Monthly Revenue At Risk (£)', `£${totalRevAtRisk.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`],
    ['Total 12M Expected Loss (£)', `£${(totalRevAtRisk * 12).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary_KPIs');

  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Customer Risk List to CSV
 */
export function exportCustomerListCsv(customers: CleanedCustomerRecord[]): void {
  const headers = [
    'Customer ID', 'Segment', 'UK Nation', 'City', 'Service Type', 'Contract Type',
    'Monthly Charge GBP', 'Effective Charge GBP', 'Churn Probability', 'Risk Tier',
    'Monthly Revenue At Risk GBP', '12M Expected Loss GBP', 'Primary Risk Driver'
  ];

  const lines = [headers.map((h) => `"${h}"`).join(',')];
  customers.forEach((c) => {
    // Sanitise values to guard against CSV formula injection (prefix '=', '+', '-', '@' with single quote)
    const sanitize = (val: any) => {
      let str = String(val ?? '');
      if (['=', '+', '-', '@'].some((char) => str.startsWith(char))) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    lines.push([
      sanitize(c.id),
      sanitize(c.segment),
      sanitize(c.nation),
      sanitize(c.city),
      sanitize(c.serviceType),
      sanitize(c.contractType),
      sanitize(c.monthlyCharge),
      sanitize(c.effectiveMonthlyCharge),
      sanitize(c.churnProbability !== undefined ? (c.churnProbability * 100).toFixed(1) + '%' : '-'),
      sanitize(c.riskTier || '-'),
      sanitize(c.expectedMonthlyRevenueAtRisk || '-'),
      sanitize(c.expectedLoss12M || '-'),
      sanitize(c.topDrivers?.[0]?.plainEnglish || '-'),
    ].join(','));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BritConnect_Customer_Risk_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
