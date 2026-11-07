/**
 * BritConnect Reports & Exports Studio
 * Section 10: Executive Summary PDF, Model Card PDF, Formatted Excel Register, and Custom Report Builder.
 */

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle,
  Sliders,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  CleanedCustomerRecord,
  TrainedModelSummary,
  CleaningActionLog,
} from '../../types/telecom';
import {
  generateExecutiveSummaryPdf,
  generateModelPerformancePdf,
  exportCustomerListExcel,
  exportCustomerListCsv,
} from '../../services/reportGenerator';

interface ReportsViewProps {
  customers: CleanedCustomerRecord[];
  activeModel: TrainedModelSummary | null;
  cleaningLogs: CleaningActionLog[];
  filtersAppliedDesc: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  customers,
  activeModel,
  cleaningLogs,
  filtersAppliedDesc,
}) => {
  const [reportTitle, setReportTitle] = useState('BritConnect Executive Churn Intelligence Briefing');
  const [includeKpis, setIncludeKpis] = useState(true);
  const [includeDrivers, setIncludeDrivers] = useState(true);
  const [includeTopRisk, setIncludeTopRisk] = useState(true);
  const [includeModelCard, setIncludeModelCard] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Compute metrics summary
  const totalCount = customers.length;
  const activeList = customers.filter((c) => c.churnFlag === 0);
  const churnedList = customers.filter((c) => c.churnFlag === 1);
  const mrr = activeList.reduce((s, c) => s + c.effectiveMonthlyCharge, 0);
  const revAtRisk = activeList.reduce((s, c) => s + (c.expectedMonthlyRevenueAtRisk || 0), 0);
  const criticalCount = activeList.filter((c) => (c.churnProbability || 0) >= 0.7).length;
  const expiring30 = activeList.filter((c) => c.contractExpiring30Days === 1).length;

  const topRisk = activeList
    .sort((a, b) => (b.expectedMonthlyRevenueAtRisk || 0) - (a.expectedMonthlyRevenueAtRisk || 0))
    .slice(0, 15);

  const handleDownloadExecutivePdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      generateExecutiveSummaryPdf(
        {
          totalCustomers: totalCount,
          activeCustomers: activeList.length,
          churnRate: totalCount > 0 ? +((churnedList.length / totalCount) * 100).toFixed(1) : 0,
          mrr,
          revenueAtRisk: revAtRisk,
          expectedLoss12M: revAtRisk * 12,
          criticalRiskCount: criticalCount,
          expiring30Days: expiring30,
        },
        topRisk,
        [],
        filtersAppliedDesc
      );
      setIsGenerating(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-serif text-[#0B1F3A] tracking-tight">
          Executive Reports & Formatted Exports
        </h1>
        <p className="text-xs text-[#5B6575] mt-1">
          Section 10: Generate branded PDFs, audit documentation, and formatted Excel workbooks with frozen headers and styling.
        </p>
      </div>

      {/* One-Click Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Executive PDF */}
        <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#0B1F3A] text-[#C9A227] flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#0B1F3A]">Executive Summary Report</h3>
            <p className="text-xs text-[#5B6575] mt-1">
              Branded navy/gold PDF containing KPI metrics grid, strategic observations, top at-risk accounts, and contract cliff breakdown.
            </p>
          </div>
          <button
            onClick={handleDownloadExecutivePdf}
            disabled={isGenerating}
            className="mt-4 w-full py-2 bg-[#0B1F3A] hover:bg-[#12305A] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>{isGenerating ? 'Compiling PDF...' : 'Download Executive PDF'}</span>
          </button>
        </div>

        {/* Card 2: Model Performance PDF */}
        <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#12305A] text-emerald-400 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#0B1F3A]">Model Performance & Audit Card</h3>
            <p className="text-xs text-[#5B6575] mt-1">
              Technical documentation PDF including ROC/PR curves, confusion matrix, calibration scores, demographic fairness, and leakage audit.
            </p>
          </div>
          <button
            onClick={() => activeModel && generateModelPerformancePdf(activeModel)}
            disabled={!activeModel}
            className="mt-4 w-full py-2 bg-[#12305A] hover:bg-[#1D4C8F] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Model Audit PDF</span>
          </button>
        </div>

        {/* Card 3: Formatted Excel Risk List */}
        <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#0B1F3A]">Customer Risk Register (XLSX)</h3>
            <p className="text-xs text-[#5B6575] mt-1">
              Formatted multi-tab Excel workbook with frozen header rows, currency formats, risk percentiles, and KPI summary sheet.
            </p>
          </div>
          <button
            onClick={() => exportCustomerListExcel(customers)}
            className="mt-4 w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel Workbook</span>
          </button>
        </div>
      </div>

      {/* Custom Report Builder */}
      <div className="bg-white rounded-xl border border-[#E3E7EE] p-6 shadow-xs">
        <h3 className="font-bold text-base text-[#0B1F3A] mb-1">Custom Retention Report Builder</h3>
        <p className="text-xs text-[#5B6575] mb-4">
          Select which analytical sections to package into your scheduled retention presentation.
        </p>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#0B1F3A] block mb-1">Report Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full max-w-xl px-3 py-2 border border-[#E3E7EE] rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <label className="flex items-center gap-2 p-3 rounded-lg border border-[#E3E7EE] hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeKpis}
                onChange={(e) => setIncludeKpis(e.target.checked)}
                className="text-[#C9A227] rounded-sm"
              />
              <span className="font-medium text-[#1A2233]">Executive KPI Grid</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-lg border border-[#E3E7EE] hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTopRisk}
                onChange={(e) => setIncludeTopRisk(e.target.checked)}
                className="text-[#C9A227] rounded-sm"
              />
              <span className="font-medium text-[#1A2233]">Top 15 Accounts at Risk</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-lg border border-[#E3E7EE] hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDrivers}
                onChange={(e) => setIncludeDrivers(e.target.checked)}
                className="text-[#C9A227] rounded-sm"
              />
              <span className="font-medium text-[#1A2233]">Feature Importance</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-lg border border-[#E3E7EE] hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={includeModelCard}
                onChange={(e) => setIncludeModelCard(e.target.checked)}
                className="text-[#C9A227] rounded-sm"
              />
              <span className="font-medium text-[#1A2233]">Model Evaluation Card</span>
            </label>
          </div>

          <div className="pt-3 border-t border-[#E3E7EE] flex justify-end">
            <button
              onClick={handleDownloadExecutivePdf}
              className="px-5 py-2.5 bg-[#C9A227] hover:bg-[#E5C566] text-[#0B1F3A] font-bold text-xs rounded-lg flex items-center gap-2 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Compile & Download Custom PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
