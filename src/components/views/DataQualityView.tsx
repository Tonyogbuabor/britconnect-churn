/**
 * BritConnect Data Quality & Cleaning Centre
 * Section 4: Transparent, configurable, reproducible cleaning pipeline with interactive Cleaning Log.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Sliders,
  RotateCcw,
  Download,
  AlertTriangle,
  FileCheck,
  FileX,
  RefreshCw,
} from 'lucide-react';
import {
  CleanedCustomerRecord,
  CleaningActionLog,
} from '../../types/telecom';
import {
  CleaningOptions,
  DEFAULT_CLEANING_OPTIONS,
} from '../../services/dataCleaning';
import { exportCustomerListExcel, exportCustomerListCsv } from '../../services/reportGenerator';

interface DataQualityViewProps {
  cleanedCustomers: CleanedCustomerRecord[];
  cleaningLogs: CleaningActionLog[];
  rejectedRows: any[];
  cleaningOptions: CleaningOptions;
  onUpdateOptionsAndRerun: (opts: CleaningOptions) => void;
}

export const DataQualityView: React.FC<DataQualityViewProps> = ({
  cleanedCustomers,
  cleaningLogs,
  rejectedRows,
  cleaningOptions,
  onUpdateOptionsAndRerun,
}) => {
  const [opts, setOpts] = useState<CleaningOptions>(cleaningOptions);
  const [isRerunning, setIsRerunning] = useState(false);

  const handleToggle = (key: keyof CleaningOptions) => {
    const updated = { ...opts, [key]: !opts[key] };
    setOpts(updated);
  };

  const handleApplyRerun = () => {
    setIsRerunning(true);
    setTimeout(() => {
      onUpdateOptionsAndRerun(opts);
      setIsRerunning(false);
    }, 200);
  };

  const handleResetDefaults = () => {
    setOpts(DEFAULT_CLEANING_OPTIONS);
    onUpdateOptionsAndRerun(DEFAULT_CLEANING_OPTIONS);
  };

  const handleDownloadRejects = () => {
    if (rejectedRows.length === 0) return;
    const jsonStr = JSON.stringify(rejectedRows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BritConnect_Rejected_Rows_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0B1F3A] tracking-tight">
            Data Quality & Transparent Cleaning Log
          </h1>
          <p className="text-xs text-[#5B6575] mt-1">
            Section 4 pipeline: Reproducible imputation, whitespace trimming, date standardization, and outlier controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCustomerListExcel(cleanedCustomers, 'BritConnect_Cleaned_Dataset')}
            className="px-3 py-1.5 bg-white border border-[#E3E7EE] hover:bg-[#F5F6F8] text-[#0B1F3A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Cleaned Excel</span>
          </button>
          <button
            onClick={() => exportCustomerListCsv(cleanedCustomers)}
            className="px-3 py-1.5 bg-white border border-[#E3E7EE] hover:bg-[#F5F6F8] text-[#0B1F3A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#1D4C8F]" />
            <span>Export Cleaned CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-xs font-medium">Cleaned Active Subscribers</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-[#0B1F3A] mt-1">
            {cleanedCustomers.length.toLocaleString('en-GB')}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
            100% Validated for ML & Analytics
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-xs font-medium">Cleaning Actions Executed</span>
            <CheckCircle2 className="w-4 h-4 text-[#1D4C8F]" />
          </div>
          <div className="text-xl font-bold text-[#0B1F3A] mt-1">
            {cleaningLogs.length} Steps
          </div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">Recorded in audit log</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-xs font-medium">Rejected Incomplete Rows</span>
            <FileX className="w-4 h-4 text-[#7A0C1E]" />
          </div>
          <div className="text-xl font-bold text-[#7A0C1E] mt-1">
            {rejectedRows.length}
          </div>
          <div className="text-[10px] text-[#5B6575] mt-0.5">
            {rejectedRows.length > 0 ? (
              <button
                onClick={handleDownloadRejects}
                className="text-[#7A0C1E] hover:underline font-semibold"
              >
                Download Rejects Audit File
              </button>
            ) : (
              'Zero rows rejected'
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs">
          <div className="flex items-center justify-between text-[#5B6575]">
            <span className="text-xs font-medium">Target Imputation Policy</span>
            <AlertTriangle className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="text-sm font-bold text-[#0B1F3A] mt-1">Zero Imputation</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
            Target integrity preserved strictly
          </div>
        </div>
      </div>

      {/* Interactive Pipeline Configuration */}
      <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-[#0B1F3A] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#C9A227]" />
              <span>Configurable Cleaning Pipeline Controls</span>
            </h3>
            <p className="text-xs text-[#5B6575]">
              Toggle individual cleaning steps and re-run to verify before and after differences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-1.5 text-xs text-[#5B6575] hover:text-[#0B1F3A] border border-[#E3E7EE] rounded-lg bg-white hover:bg-slate-50 transition"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleApplyRerun}
              disabled={isRerunning}
              className="px-4 py-1.5 bg-[#0B1F3A] hover:bg-[#12305A] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRerunning ? 'animate-spin' : ''}`} />
              <span>Re-run Cleaning Pipeline</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Toggle 1 */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E3E7EE] hover:bg-[#F5F6F8] cursor-pointer transition">
            <input
              type="checkbox"
              checked={opts.trimAndStandardiseCasing}
              onChange={() => handleToggle('trimAndStandardiseCasing')}
              className="mt-0.5 text-[#C9A227] rounded-sm focus:ring-[#C9A227]"
            />
            <div>
              <strong className="text-[#0B1F3A] block">Whitespace & Casing Standardization</strong>
              <span className="text-[#5B6575] text-[11px]">
                Normalises "yes/Y/1", strips leading/trailing spaces, maps nation spelling variants.
              </span>
            </div>
          </label>

          {/* Toggle 2 */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E3E7EE] hover:bg-[#F5F6F8] cursor-pointer transition">
            <input
              type="checkbox"
              checked={opts.coerceNumericsAndDates}
              onChange={() => handleToggle('coerceNumericsAndDates')}
              className="mt-0.5 text-[#C9A227] rounded-sm focus:ring-[#C9A227]"
            />
            <div>
              <strong className="text-[#0B1F3A] block">Numeric & Date Coercion</strong>
              <span className="text-[#5B6575] text-[11px]">
                Strips £ currency signs, commas, and percentage characters. Converts dates to ISO.
              </span>
            </div>
          </label>

          {/* Toggle 3 */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E3E7EE] hover:bg-[#F5F6F8] cursor-pointer transition">
            <input
              type="checkbox"
              checked={opts.deduplicateIds}
              onChange={() => handleToggle('deduplicateIds')}
              className="mt-0.5 text-[#C9A227] rounded-sm focus:ring-[#C9A227]"
            />
            <div>
              <strong className="text-[#0B1F3A] block">Customer ID Deduplication</strong>
              <span className="text-[#5B6575] text-[11px]">
                Keeps the most recent record per Customer ID. Never duplicates primary keys.
              </span>
            </div>
          </label>

          {/* Toggle 4 */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E3E7EE] hover:bg-[#F5F6F8] cursor-pointer transition">
            <input
              type="checkbox"
              checked={opts.imputeMissingValues}
              onChange={() => handleToggle('imputeMissingValues')}
              className="mt-0.5 text-[#C9A227] rounded-sm focus:ring-[#C9A227]"
            />
            <div>
              <strong className="text-[#0B1F3A] block">Grouped Median Imputation</strong>
              <span className="text-[#5B6575] text-[11px]">
                Fills missing numeric usage and charges with median by Service Type. Never touches target.
              </span>
            </div>
          </label>

          {/* Toggle 5 */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-[#E3E7EE] hover:bg-[#F5F6F8] cursor-pointer transition">
            <input
              type="checkbox"
              checked={opts.fixDerivedConsistency}
              onChange={() => handleToggle('fixDerivedConsistency')}
              className="mt-0.5 text-[#C9A227] rounded-sm focus:ring-[#C9A227]"
            />
            <div>
              <strong className="text-[#0B1F3A] block">Derived Consistency Alignment</strong>
              <span className="text-[#5B6575] text-[11px]">
                Recomputes tenure and age band if mathematically inconsistent with join date.
              </span>
            </div>
          </label>

          {/* Toggle 6: Target contradiction */}
          <div className="p-3 rounded-lg border border-[#E3E7EE] bg-slate-50/50">
            <strong className="text-[#0B1F3A] block">Target Contradiction Rule</strong>
            <span className="text-[#5B6575] text-[11px] block mb-2">
              If Churn Flag (1/0) disagrees with Churn Status (Active/Churned):
            </span>
            <select
              value={opts.resolveTargetContradictions}
              onChange={(e) =>
                setOpts({ ...opts, resolveTargetContradictions: e.target.value as any })
              }
              className="w-full bg-white border border-[#E3E7EE] rounded-md px-2 py-1 text-xs text-[#0B1F3A]"
            >
              <option value="flag_wins">Churn Flag (Numeric) Overrides Status</option>
              <option value="status_wins">Churn Status (Text) Overrides Flag</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cleaning Action Log Table */}
      <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs">
        <h3 className="font-bold text-base text-[#0B1F3A] mb-1">Audit Cleaning Log</h3>
        <p className="text-xs text-[#5B6575] mb-4">
          Every modification made to the raw dataset is logged with row impact counts and timestamps.
        </p>

        <div className="border border-[#E3E7EE] rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F5F6F8] text-[#0B1F3A] border-b border-[#E3E7EE]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Step Name</th>
                <th className="py-2.5 px-4 font-semibold">Description</th>
                <th className="py-2.5 px-4 font-semibold text-right">Rows Affected</th>
                <th className="py-2.5 px-4 font-semibold">Execution Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7EE]">
              {cleaningLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-[#0B1F3A] whitespace-nowrap">
                    {log.step}
                  </td>
                  <td className="py-2.5 px-4 text-[#1A2233]">{log.description}</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-[#1D4C8F] whitespace-nowrap">
                    {log.rowsAffected.toLocaleString('en-GB')}
                  </td>
                  <td className="py-2.5 px-4 text-[#5B6575]">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
