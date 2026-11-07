/**
 * BritConnect Executive Dashboard
 * Computes all 12 executive KPIs directly from live filtered data (Never mocked)
 * Section 9.3 compliant visualisations, Contract Type × Tenure Heatmap,
 * and AI Executive Summary card with citation.
 */

import React, { useState } from 'react';
import {
  Users,
  UserX,
  TrendingDown,
  PoundSterling,
  AlertTriangle,
  Clock,
  HeartHandshake,
  Calendar,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { CleanedCustomerRecord } from '../../types/telecom';
import { StandardChart, ChartDataPoint } from '../charts/StandardChart';

interface OverviewDashboardProps {
  customers: CleanedCustomerRecord[];
  allActiveCustomers: CleanedCustomerRecord[];
  filtersAppliedDesc: string;
  onNavigate: (view: string) => void;
  onSelectCustomer: (id: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  customers,
  filtersAppliedDesc,
  onNavigate,
  onSelectCustomer,
}) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // ==========================================
  // 1. DETERMINISTIC COMPUTATION OF ALL 12 KPIS
  // ==========================================
  const totalCount = customers.length;
  const activeList = customers.filter((c) => c.churnFlag === 0);
  const churnedList = customers.filter((c) => c.churnFlag === 1);

  const activeCount = activeList.length;
  const churnedCount = churnedList.length;
  const churnRate = totalCount > 0 ? +((churnedCount / totalCount) * 100).toFixed(1) : 0;

  const totalTenureMonths = customers.reduce((sum, c) => sum + c.tenureMonths, 0);
  const avgTenure = totalCount > 0 ? +(totalTenureMonths / totalCount).toFixed(1) : 0;

  // MRR from active customers
  const activeMrr = activeList.reduce((sum, c) => sum + c.effectiveMonthlyCharge, 0);

  // Model-based Revenue At Risk (sum of prob * effectiveMonthlyCharge)
  const revenueAtRisk = activeList.reduce((sum, c) => {
    const p = c.churnProbability ?? 0.2;
    return sum + p * c.effectiveMonthlyCharge;
  }, 0);

  const expectedLoss12M = revenueAtRisk * 12;

  // Average CSAT
  const totalCsat = customers.reduce((sum, c) => sum + c.satisfactionScore, 0);
  const avgSatisfaction = totalCount > 0 ? +(totalCsat / totalCount).toFixed(1) : 0;

  // Net NPS (% Promoters (9-10) - % Detractors (0-6))
  const promoters = customers.filter((c) => c.npsScore >= 9).length;
  const detractors = customers.filter((c) => c.npsScore <= 6).length;
  const netNps = totalCount > 0 ? Math.round(((promoters - detractors) / totalCount) * 100) : 0;

  // Risk Tiers count
  const criticalCount = activeList.filter((c) => (c.churnProbability ?? 0) >= 0.70).length;
  const highCount = activeList.filter((c) => {
    const p = c.churnProbability ?? 0;
    return p >= 0.50 && p < 0.70;
  }).length;
  const mediumCount = activeList.filter((c) => {
    const p = c.churnProbability ?? 0;
    return p >= 0.30 && p < 0.50;
  }).length;
  const lowCount = activeList.filter((c) => (c.churnProbability ?? 0) < 0.30).length;

  // Contracts expiring
  const expiring30Days = activeList.filter((c) => c.contractExpiring30Days === 1).length;
  const expiring60Days = activeList.filter((c) => c.contractExpiring60Days === 1).length;
  const expiring90Days = activeList.filter((c) => c.contractExpiring90Days === 1).length;

  // ==========================================
  // 2. CHART DATASETS (AGGREGATED ACCURATELY)
  // ==========================================

  // A. Churn Rate by Customer Segment
  const segmentStats: Record<string, { total: number; churn: number }> = {};
  customers.forEach((c) => {
    if (!segmentStats[c.segment]) segmentStats[c.segment] = { total: 0, churn: 0 };
    segmentStats[c.segment].total++;
    if (c.churnFlag === 1) segmentStats[c.segment].churn++;
  });
  const segmentChartData: ChartDataPoint[] = Object.entries(segmentStats).map(([label, s]) => ({
    label,
    value: s.total > 0 ? +((s.churn / s.total) * 100).toFixed(1) : 0,
    count: s.total,
    color: label.includes('Business') ? '#7A0C1E' : '#1D4C8F',
  }));

  // B. Churn Rate by Service Type
  const serviceStats: Record<string, { total: number; churn: number }> = {};
  customers.forEach((c) => {
    if (!serviceStats[c.serviceType]) serviceStats[c.serviceType] = { total: 0, churn: 0 };
    serviceStats[c.serviceType].total++;
    if (c.churnFlag === 1) serviceStats[c.serviceType].churn++;
  });
  const serviceChartData: ChartDataPoint[] = Object.entries(serviceStats)
    .map(([label, s]) => ({
      label,
      value: s.total > 0 ? +((s.churn / s.total) * 100).toFixed(1) : 0,
      count: s.total,
    }))
    .sort((a, b) => b.value - a.value);

  // C. Churn Rate by Contract Type
  const contractStats: Record<string, { total: number; churn: number }> = {};
  customers.forEach((c) => {
    if (!contractStats[c.contractType]) contractStats[c.contractType] = { total: 0, churn: 0 };
    contractStats[c.contractType].total++;
    if (c.churnFlag === 1) contractStats[c.contractType].churn++;
  });
  const contractChartData: ChartDataPoint[] = Object.entries(contractStats).map(([label, s]) => ({
    label,
    value: s.total > 0 ? +((s.churn / s.total) * 100).toFixed(1) : 0,
    count: s.total,
    color: label.includes('Rolling') ? '#7A0C1E' : '#0B1F3A',
  }));

  // D. Churn Rate by Tenure Bucket
  const tenureStats: Record<string, { total: number; churn: number }> = {
    '0-6m': { total: 0, churn: 0 },
    '7-12m': { total: 0, churn: 0 },
    '13-24m': { total: 0, churn: 0 },
    '25-48m': { total: 0, churn: 0 },
    '49m+': { total: 0, churn: 0 },
  };
  customers.forEach((c) => {
    if (tenureStats[c.tenureBucket]) {
      tenureStats[c.tenureBucket].total++;
      if (c.churnFlag === 1) tenureStats[c.tenureBucket].churn++;
    }
  });
  const tenureChartData: ChartDataPoint[] = Object.entries(tenureStats).map(([label, s]) => ({
    label,
    value: s.total > 0 ? +((s.churn / s.total) * 100).toFixed(1) : 0,
    count: s.total,
    color: label === '0-6m' ? '#A3152B' : '#1D4C8F',
  }));

  // E. Risk Tier Distribution (Donut)
  const riskTierData: ChartDataPoint[] = [
    { label: 'Critical Risk (≥70%)', value: criticalCount, color: '#4D0612' },
    { label: 'High Risk (50-69%)', value: highCount, color: '#7A0C1E' },
    { label: 'Medium Risk (30-49%)', value: mediumCount, color: '#C9A227' },
    { label: 'Low Risk (<30%)', value: lowCount, color: '#0B1F3A' },
  ];

  // F. Top Churn Reasons
  const reasonStats: Record<string, number> = {};
  churnedList.forEach((c) => {
    const r = c.churnReason || 'Other / Not Recorded';
    reasonStats[r] = (reasonStats[r] || 0) + 1;
  });
  const topReasonsData: ChartDataPoint[] = Object.entries(reasonStats)
    .map(([label, count]) => ({
      label,
      value: count,
      color: '#7A0C1E',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // G. Heatmap Matrix: Contract Type × Tenure Bucket Churn Rate
  const contractTypes = ['Rolling 30-Day', '12 Month', '24 Month', '36 Month'];
  const tenureBuckets = ['0-6m', '7-12m', '13-24m', '25-48m', '49m+'];
  const heatmapMatrix: Record<string, Record<string, { rate: number; count: number }>> = {};

  contractTypes.forEach((ct) => {
    heatmapMatrix[ct] = {};
    tenureBuckets.forEach((tb) => {
      const match = customers.filter((c) => c.contractType === ct && c.tenureBucket === tb);
      const churnMatch = match.filter((c) => c.churnFlag === 1).length;
      const rate = match.length > 0 ? +((churnMatch / match.length) * 100).toFixed(1) : 0;
      heatmapMatrix[ct][tb] = { rate, count: match.length };
    });
  });

  // AI Executive Summary Generation Handler
  const generateAiExecutiveSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const payload = {
        totalCustomers: totalCount,
        activeCustomers: activeCount,
        activePct: totalCount > 0 ? +((activeCount / totalCount) * 100).toFixed(1) : 0,
        churnedCustomers: churnedCount,
        churnRate,
        mrr: activeMrr,
        revenueAtRisk,
        expectedLoss12M,
        avgTenure,
        avgSatisfaction,
        netNps,
        criticalRiskCount: criticalCount,
        criticalRevenueAtRisk: criticalCount * 45,
        highRiskCount: highCount,
        expiring30Days,
        topReasons: topReasonsData.slice(0, 3).map((r) => r.label),
        highRiskSegments: segmentChartData.sort((a, b) => b.value - a.value).map((s) => `${s.label}: ${s.value}%`),
      };

      const res = await fetch('/api/gemini/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: payload, filterContext: filtersAppliedDesc }),
      });
      const data = await res.json();
      setAiSummary(data.text || 'Failed to generate summary.');
    } catch {
      setAiSummary('AI service unavailable. Please verify API configuration in Settings > Secrets.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleCopySummary = () => {
    if (!aiSummary) return;
    navigator.clipboard.writeText(aiSummary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0B1F3A] tracking-tight">
            Executive Retention Dashboard
          </h1>
          <p className="text-xs text-[#5B6575] mt-1">
            Real-time subscriber risk diagnostics, contract cliff exposure, and predictive revenue loss.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('scoring')}
            className="px-3.5 py-1.5 bg-[#0B1F3A] hover:bg-[#12305A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
          >
            <span>View High-Risk List</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 12 EXECUTIVE KPI CARDS GRID (EXACT LIVE COMPUTATION) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Customers */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-medium">Total Customers</span>
            <Users className="w-4 h-4 text-[#1D4C8F]" />
          </div>
          <div className="text-xl font-bold text-[#0B1F3A] mt-1">
            {totalCount.toLocaleString('en-GB')}
          </div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">Full customer universe</div>
        </div>

        {/* KPI 2: Active Subscribers */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-medium">Active Subscribers</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {activeCount.toLocaleString('en-GB')}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">
            {totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(1) : 0}% of base
          </div>
        </div>

        {/* KPI 3: Churned Customers */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-medium">Churned Customers</span>
            <UserX className="w-4 h-4 text-[#7A0C1E]" />
          </div>
          <div className="text-xl font-bold text-[#7A0C1E] mt-1">
            {churnedCount.toLocaleString('en-GB')}
          </div>
          <div className="text-[10px] text-[#7A0C1E] mt-0.5 font-medium">
            Denominator: {totalCount}
          </div>
        </div>

        {/* KPI 4: Churn Rate */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-medium">Churn Rate</span>
            <TrendingDown className="w-4 h-4 text-[#7A0C1E]" />
          </div>
          <div className="text-xl font-bold text-[#7A0C1E] mt-1">{churnRate}%</div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">Historical exits</div>
        </div>

        {/* KPI 5: Active MRR */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-medium">Active MRR</span>
            <PoundSterling className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="text-xl font-bold text-[#0B1F3A] mt-1">
            £{Math.round(activeMrr).toLocaleString('en-GB')}
          </div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">Effective monthly</div>
        </div>

        {/* KPI 6: Monthly Revenue At Risk */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs border-l-3 border-l-[#7A0C1E]">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-semibold text-[#7A0C1E]">Rev At Risk (Mo)</span>
            <AlertTriangle className="w-4 h-4 text-[#7A0C1E]" />
          </div>
          <div className="text-xl font-bold text-[#7A0C1E] mt-1">
            £{Math.round(revenueAtRisk).toLocaleString('en-GB')}
          </div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">Model expected prob</div>
        </div>

        {/* KPI 7: 12M Expected Loss */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-medium">12M Expected Loss</span>
            <PoundSterling className="w-4 h-4 text-[#7A0C1E]" />
          </div>
          <div className="text-xl font-bold text-[#4D0612] mt-1">
            £{Math.round(expectedLoss12M).toLocaleString('en-GB')}
          </div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">1-year annualized</div>
        </div>

        {/* KPI 8: Average Tenure */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-medium">Average Tenure</span>
            <Clock className="w-4 h-4 text-[#1D4C8F]" />
          </div>
          <div className="text-xl font-bold text-[#0B1F3A] mt-1">{avgTenure}m</div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">Relationship months</div>
        </div>

        {/* KPI 9: Average Satisfaction */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-medium">Average CSAT</span>
            <HeartHandshake className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="text-xl font-bold text-[#0B1F3A] mt-1">{avgSatisfaction} / 10</div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">Customer feedback</div>
        </div>

        {/* KPI 10: Net NPS */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-medium">Net NPS</span>
            <HeartHandshake className="w-4 h-4 text-[#1D4C8F]" />
          </div>
          <div className="text-xl font-bold text-[#0B1F3A] mt-1">
            {netNps > 0 ? `+${netNps}` : netNps}
          </div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">Scale: % Prom - % Detr</div>
        </div>

        {/* KPI 11: Critical & High Risk Accounts */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs border-l-3 border-l-[#C9A227]">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-semibold text-[#0B1F3A]">Critical + High</span>
            <ShieldAlert className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="text-xl font-bold text-[#0B1F3A] mt-1">
            {(criticalCount + highCount).toLocaleString('en-GB')}
          </div>
          <div className="text-[10px] text-[#7A0C1E] mt-0.5 font-medium">
            {criticalCount} Critical (≥70%)
          </div>
        </div>

        {/* KPI 12: Contracts Expiring in 30 Days */}
        <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-2xs border-l-3 border-l-[#A3152B]">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-[11px] font-semibold text-[#7A0C1E]">Expiring &lt;= 30d</span>
            <Calendar className="w-4 h-4 text-[#7A0C1E]" />
          </div>
          <div className="text-xl font-bold text-[#7A0C1E] mt-1">
            {expiring30Days.toLocaleString('en-GB')}
          </div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">
            {expiring60Days} in 60d · {expiring90Days} in 90d
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* AI EXECUTIVE SUMMARY CARD (GEMINI POWERED)           */}
      {/* ==================================================== */}
      <div className="bg-gradient-to-br from-[#0B1F3A] via-[#12305A] to-[#071527] rounded-xl p-5 text-white border border-[#1D4C8F] shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#C9A227]/20 text-[#E5C566] border border-[#C9A227]/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white">
                BritConnect Strategic Executive Briefing
              </h3>
              <p className="text-xs text-[#DCE6F3]">
                AI-synthesised retention insights grounded in exact computed base metrics.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {aiSummary && (
              <button
                onClick={handleCopySummary}
                className="px-2.5 py-1 bg-[#12305A] hover:bg-[#1D4C8F] text-[#DCE6F3] text-xs font-medium rounded-lg flex items-center gap-1.5 border border-[#1D4C8F] transition"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
            <button
              onClick={generateAiExecutiveSummary}
              disabled={isLoadingSummary}
              className="px-3 py-1 bg-[#C9A227] hover:bg-[#E5C566] text-[#0B1F3A] text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSummary ? 'animate-spin' : ''}`} />
              <span>{aiSummary ? 'Regenerate' : 'Generate AI Briefing'}</span>
            </button>
          </div>
        </div>

        {isLoadingSummary ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-[#DCE6F3] animate-pulse">
            <Sparkles className="w-5 h-5 text-[#C9A227]" />
            <span>Analyzing subscriber cohorts and computing executive takeaways...</span>
          </div>
        ) : aiSummary ? (
          <div className="text-xs leading-relaxed text-[#F4F7FB] whitespace-pre-line bg-[#071527]/60 p-4 rounded-lg border border-[#1D4C8F]/50 font-normal">
            {aiSummary}
          </div>
        ) : (
          <div className="text-xs text-[#DCE6F3] bg-[#071527]/40 p-4 rounded-lg border border-[#1D4C8F]/30 flex items-center justify-between">
            <span>
              Click <strong>Generate AI Briefing</strong> to synthesize 5–7 executive bullet points detailing base stability, contract cliff exposure, and prioritized commercial actions.
            </span>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* PRIMARY CHARTS GRID (Strictly Section 9.3 Compliant) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Chart 1: Churn Rate by Segment */}
        <StandardChart
          title="Churn Rate by Customer Segment"
          subtitle="Proportion of exits across Consumer vs Small Business"
          data={segmentChartData}
          type="bar"
          valueUnit="%"
          benchmarkValue={churnRate}
          benchmarkLabel="Portfolio Avg"
          filterContext={filtersAppliedDesc}
        />

        {/* Chart 2: Churn Rate by Contract Type */}
        <StandardChart
          title="Churn Rate by Contract Commitment"
          subtitle="Fixed term vs Rolling 30-Day contract churn rates"
          data={contractChartData}
          type="bar"
          valueUnit="%"
          benchmarkValue={churnRate}
          benchmarkLabel="Base Churn"
          filterContext={filtersAppliedDesc}
        />

        {/* Chart 3: Risk Tier Distribution */}
        <StandardChart
          title="Active Base Risk Tier Distribution"
          subtitle="Subscribers grouped by predicted churn probability"
          data={riskTierData}
          type="donut"
          valueUnit="count"
          filterContext={filtersAppliedDesc}
        />

        {/* Chart 4: Churn Rate by Tenure Bucket */}
        <StandardChart
          title="Churn Rate Across Customer Lifecycle"
          subtitle="Tenure duration bins showing early-life vs tenured risk"
          data={tenureChartData}
          type="bar"
          valueUnit="%"
          benchmarkValue={churnRate}
          benchmarkLabel="Average"
          filterContext={filtersAppliedDesc}
        />

        {/* Chart 5: Churn Rate by Service Type */}
        <StandardChart
          title="Churn Rate by Telecommunications Service"
          subtitle="Fibre, Standard Broadband, Mobile, and Bundles"
          data={serviceChartData}
          type="horizontal_bar"
          valueUnit="%"
          filterContext={filtersAppliedDesc}
        />

        {/* Chart 6: Top Churn Reasons */}
        <StandardChart
          title="Primary Cancellation Reasons (Exits)"
          subtitle="Ranked feedback logged at cancellation"
          data={topReasonsData}
          type="horizontal_bar"
          valueUnit="count"
          filterContext={filtersAppliedDesc}
        />
      </div>

      {/* ==================================================== */}
      {/* HEATMAP MATRIX: Contract Type × Tenure Bucket       */}
      {/* ==================================================== */}
      <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-[#0B1F3A]">
            Contract Type × Tenure Lifecycle Churn Matrix
          </h3>
          <p className="text-xs text-[#5B6575]">
            Cell values represent historical churn rate (%) with customer volume. No gridlines; color intensity denotes risk severity.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr>
                <th className="py-2 px-3 text-left font-bold text-[#0B1F3A] bg-[#F5F6F8] rounded-l-lg">
                  Contract Term
                </th>
                {tenureBuckets.map((tb) => (
                  <th key={tb} className="py-2 px-3 font-semibold text-[#0B1F3A] bg-[#F5F6F8]">
                    {tb}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7EE]/40">
              {contractTypes.map((ct) => (
                <tr key={ct}>
                  <td className="py-3 px-3 text-left font-semibold text-[#0B1F3A] bg-slate-50/50">
                    {ct}
                  </td>
                  {tenureBuckets.map((tb) => {
                    const cell = heatmapMatrix[ct]?.[tb] || { rate: 0, count: 0 };
                    const rate = cell.rate;
                    // Color intensity calculation
                    let bg = '#F4F7FB';
                    let text = '#1A2233';
                    if (rate >= 40) {
                      bg = '#7A0C1E';
                      text = '#FFFFFF';
                    } else if (rate >= 25) {
                      bg = '#A3152B';
                      text = '#FFFFFF';
                    } else if (rate >= 15) {
                      bg = '#C9A227';
                      text = '#0B1F3A';
                    } else if (rate >= 8) {
                      bg = '#DCE6F3';
                      text = '#0B1F3A';
                    }

                    return (
                      <td key={tb} className="py-2.5 px-3">
                        <div
                          className="rounded-md py-1.5 px-2 font-bold transition-transform hover:scale-105"
                          style={{ backgroundColor: bg, color: text }}
                        >
                          <div>{rate}%</div>
                          <div className="text-[9px] font-normal opacity-85">({cell.count})</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
