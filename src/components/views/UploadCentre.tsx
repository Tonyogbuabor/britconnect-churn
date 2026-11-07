/**
 * BritConnect Upload Centre & Ingestion Hub
 * Supports Excel (.xlsx, .xls, .xlsm, .ods), CSV, TSV, JSON, NDJSON.
 * Automatic column mapping with manual dropdown overrides.
 * 20-row preview and comprehensive pre-commit Validation Report.
 */

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  RawCustomerRecord,
  ValidationReport,
  ColumnSchemaDefinition,
} from '../../types/telecom';
import {
  AUTHORITATIVE_COLUMNS,
  generateBlankCsvTemplate,
  generateBlankXlsxTemplate,
  generateDataDictionaryCsv,
} from '../../services/schemaRegistry';
import {
  parseUploadedFile,
  applyMapping,
  validateDataset,
  ParsedFileResult,
} from '../../services/dataIngestion';
import { generateBritConnectSampleDataset } from '../../services/sampleDataGenerator';

interface UploadCentreProps {
  onCommitData: (
    records: RawCustomerRecord[],
    action: 'initial_upload' | 'merge_upsert' | 'replace' | 'score_only',
    fileName: string
  ) => void;
  hasExistingData: boolean;
  existingRowCount: number;
}

export const UploadCentre: React.FC<UploadCentreProps> = ({
  onCommitData,
  hasExistingData,
  existingRowCount,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedFileResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge_upsert' | 'score_only'>(
    hasExistingData ? 'merge_upsert' : 'replace'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File Drop / Selection Handler
  const handleFile = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await parseUploadedFile(file);
      setParseResult(result);
      setColumnMapping(result.mapping);

      // Apply initial mapping and run validation
      const standardRows = applyMapping(result.rawRows, result.mapping);
      const report = validateDataset(standardRows);
      setValidationReport(report);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Load Demo Dataset
  const handleLoadDemoDataset = () => {
    setIsLoading(true);
    setTimeout(() => {
      const demoRecords = generateBritConnectSampleDataset(1000, 2026);
      const rawHeaders = AUTHORITATIVE_COLUMNS.map((c) => c.name);
      const mapping: Record<string, string> = {};
      rawHeaders.forEach((h) => (mapping[h] = h));

      setParseResult({
        fileName: 'BritConnect_Synthetic_Customer_Base_1000.csv',
        fileSize: 450000,
        rawHeaders,
        rawRows: demoRecords,
        previewRows: demoRecords.slice(0, 20),
        mapping,
        unmappedHeaders: [],
      });
      setColumnMapping(mapping);

      const report = validateDataset(demoRecords);
      setValidationReport(report);
      setIsLoading(false);
    }, 200);
  };

  // Update a column mapping override
  const handleMappingChange = (incomingHeader: string, targetColName: string) => {
    const updated = { ...columnMapping };
    if (targetColName === '__IGNORE__') {
      delete updated[incomingHeader];
    } else {
      updated[incomingHeader] = targetColName;
    }
    setColumnMapping(updated);

    if (parseResult) {
      const standardRows = applyMapping(parseResult.rawRows, updated);
      const report = validateDataset(standardRows);
      setValidationReport(report);
    }
  };

  // Commit Import
  const handleCommit = () => {
    if (!parseResult) return;
    const finalRows = applyMapping(parseResult.rawRows, columnMapping);
    const action = hasExistingData ? importMode : 'initial_upload';
    onCommitData(finalRows, action, parseResult.fileName);
  };

  // Download Templates
  const handleDownloadCsvTemplate = () => {
    const csvContent = generateBlankCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BritConnect_Customer_Template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadXlsxTemplate = () => {
    const buffer = generateBlankXlsxTemplate();
    const blob = new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BritConnect_Customer_Template.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDataDictionary = () => {
    const csv = generateDataDictionaryCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BritConnect_38_Column_Data_Dictionary.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0B1F3A] tracking-tight">
            Data Ingestion & Upload Centre
          </h1>
          <p className="text-xs text-[#5B6575] mt-1">
            Upload subscriber records in Excel (.xlsx, .xls), CSV, TSV, or JSON. Automated schema mapping and pre-commit validation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadCsvTemplate}
            className="px-3 py-1.5 bg-white border border-[#E3E7EE] hover:bg-[#F5F6F8] text-[#0B1F3A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#1D4C8F]" />
            <span>Blank CSV Template</span>
          </button>
          <button
            onClick={handleDownloadXlsxTemplate}
            className="px-3 py-1.5 bg-white border border-[#E3E7EE] hover:bg-[#F5F6F8] text-[#0B1F3A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Blank Excel (XLSX)</span>
          </button>
          <button
            onClick={handleDownloadDataDictionary}
            className="px-3 py-1.5 bg-white border border-[#E3E7EE] hover:bg-[#F5F6F8] text-[#0B1F3A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Data Dictionary</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[#F6DDE1] border border-[#A3152B] rounded-xl text-xs text-[#4D0612] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#7A0C1E]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drop Zone & Demo Loader */}
      {!parseResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`col-span-2 border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#C9A227] bg-[#F4F7FB]'
                : 'border-[#1D4C8F]/30 bg-white hover:border-[#C9A227] hover:bg-[#F4F7FB]/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.xlsm,.ods,.csv,.tsv,.txt,.json,.ndjson"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-[#0B1F3A] text-[#C9A227] flex items-center justify-center mb-4 shadow-sm">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#0B1F3A]">
              Drag and drop your subscriber file here
            </h3>
            <p className="text-xs text-[#5B6575] mt-1 max-w-sm">
              Supports .xlsx, .xls, .csv, .tsv, .json. Automatically handles delimiters, encodings, and UTF-8 BOM.
            </p>
            <span className="mt-4 px-4 py-2 bg-[#0B1F3A] text-white text-xs font-semibold rounded-lg hover:bg-[#12305A] transition shadow-xs">
              Browse Local Files
            </span>
          </div>

          {/* Quick Demo Loader Card */}
          <div className="bg-gradient-to-br from-[#0B1F3A] to-[#12305A] rounded-2xl p-6 text-white flex flex-col justify-between border border-[#1D4C8F] shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#C9A227]/20 border border-[#C9A227]/40 text-[#E5C566] flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-white">
                No dataset at hand?
              </h3>
              <p className="text-xs text-[#DCE6F3] mt-2 leading-relaxed">
                Instantly load the verified <strong>BritConnect Synthetic Dataset</strong>: 1,000 UK telecom subscribers with realistic churn risk factors, contract expiry dates, CSAT, and complaints.
              </p>
            </div>
            <button
              onClick={handleLoadDemoDataset}
              disabled={isLoading}
              className="mt-6 w-full py-2.5 bg-[#C9A227] hover:bg-[#E5C566] text-[#0B1F3A] text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition shadow-xs"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Generating Cohort...' : 'Load BritConnect Demo Base'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Parse Result, Mapping & Validation Review */}
      {parseResult && validationReport && (
        <div className="space-y-6">
          {/* File Meta Header Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0B1F3A] text-[#C9A227] flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0B1F3A]">{parseResult.fileName}</h4>
                <p className="text-xs text-[#5B6575]">
                  {(parseResult.fileSize / 1024).toFixed(1)} KB · {parseResult.rawRows.length.toLocaleString('en-GB')} rows detected · {parseResult.rawHeaders.length} columns
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setParseResult(null);
                  setValidationReport(null);
                }}
                className="px-3 py-1.5 text-xs text-[#5B6575] hover:text-[#0B1F3A] border border-[#E3E7EE] rounded-lg bg-white hover:bg-slate-50 transition"
              >
                Choose Different File
              </button>
            </div>
          </div>

          {/* Validation Score & Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Data Quality Score Card */}
            <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#5B6575]">Data Quality Score</span>
                <div className="text-2xl font-bold text-[#0B1F3A] mt-1">
                  {validationReport.dataQualityScore} / 100
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {validationReport.dataQualityScore >= 80 ? 'High Quality Integrity' : 'Review Warnings'}
                </span>
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                  validationReport.dataQualityScore >= 80
                    ? 'bg-emerald-100 text-emerald-800'
                    : validationReport.dataQualityScore >= 60
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {validationReport.dataQualityScore}%
              </div>
            </div>

            {/* Target Balance */}
            <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs">
              <span className="text-xs font-medium text-[#5B6575]">Churn Class Balance</span>
              <div className="text-lg font-bold text-[#0B1F3A] mt-1">
                {validationReport.targetClassBalance.churnRate}% Churned
              </div>
              <div className="text-[10px] text-[#5B6575] mt-0.5">
                {validationReport.targetClassBalance.active} Active · {validationReport.targetClassBalance.churned} Exits
              </div>
            </div>

            {/* Duplicate IDs */}
            <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs">
              <span className="text-xs font-medium text-[#5B6575]">Duplicate Customer IDs</span>
              <div className="text-lg font-bold text-[#0B1F3A] mt-1">
                {validationReport.duplicateIdCount}
              </div>
              <div className="text-[10px] text-[#5B6575] mt-0.5">
                {validationReport.duplicateIdCount > 0 ? 'Will deduplicate on ingest' : 'Zero duplicates'}
              </div>
            </div>

            {/* NPS Scale */}
            <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs">
              <span className="text-xs font-medium text-[#5B6575]">Detected NPS Scale</span>
              <div className="text-lg font-bold text-[#0B1F3A] mt-1">
                {validationReport.detectedNpsScale === '0..10' ? '0 to 10 Scale' : '-100 to +100 Scale'}
              </div>
              <div className="text-[10px] text-[#5B6575] mt-0.5">Automated formula adjustment</div>
            </div>
          </div>

          {/* Column Mapping Section */}
          <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-[#0B1F3A]">Column Schema Mapping</h3>
                <p className="text-xs text-[#5B6575]">
                  Fuzzy mapping matched uploaded headers to the authoritative 38-column dictionary. Override with the dropdowns if required.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#1D4C8F] bg-[#F4F7FB] px-2.5 py-1 rounded-md border border-[#1D4C8F]/20">
                {Object.keys(columnMapping).length} of 38 Columns Mapped
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto border border-[#E3E7EE] rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F6F8] text-[#0B1F3A] sticky top-0 border-b border-[#E3E7EE]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Uploaded File Header</th>
                    <th className="py-2.5 px-4 font-semibold">Matched Schema Column</th>
                    <th className="py-2.5 px-4 font-semibold">Target Data Type</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E7EE]">
                  {parseResult.rawHeaders.map((rawHeader) => {
                    const mappedTarget = columnMapping[rawHeader] || '';
                    const colDef = AUTHORITATIVE_COLUMNS.find((c) => c.name === mappedTarget);

                    return (
                      <tr key={rawHeader} className="hover:bg-slate-50">
                        <td className="py-2 px-4 font-medium text-[#1A2233]">
                          <code>{rawHeader}</code>
                        </td>
                        <td className="py-2 px-4">
                          <select
                            value={mappedTarget || '__IGNORE__'}
                            onChange={(e) => handleMappingChange(rawHeader, e.target.value)}
                            className="bg-white border border-[#E3E7EE] rounded-md px-2 py-1 text-xs text-[#0B1F3A] focus:outline-hidden focus:border-[#C9A227] w-64"
                          >
                            <option value="__IGNORE__">-- Unmapped / Ignore --</option>
                            {AUTHORITATIVE_COLUMNS.map((col) => (
                              <option key={col.name} value={col.name}>
                                #{col.colNumber} {col.name} ({col.type})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-4 text-[#5B6575]">
                          {colDef ? colDef.type : 'Unmapped'}
                        </td>
                        <td className="py-2 px-4">
                          {colDef ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mapped
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" /> Ignored
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 20-Row Data Preview */}
          <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs">
            <h3 className="font-bold text-base text-[#0B1F3A] mb-1">
              Sample Data Preview (First 20 Records)
            </h3>
            <p className="text-xs text-[#5B6575] mb-3">
              Review raw values before committing to persistent database.
            </p>
            <div className="max-h-64 overflow-auto border border-[#E3E7EE] rounded-lg">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-[#F5F6F8] text-[#0B1F3A] sticky top-0 border-b border-[#E3E7EE]">
                  <tr>
                    {parseResult.rawHeaders.slice(0, 10).map((h) => (
                      <th key={h} className="py-2 px-3 font-semibold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E7EE]">
                  {parseResult.previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {parseResult.rawHeaders.slice(0, 10).map((h) => (
                        <td key={h} className="py-1.5 px-3 whitespace-nowrap text-[#1A2233]">
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commit Options Box */}
          <div className="bg-[#0B1F3A] rounded-xl p-6 text-white border border-[#1D4C8F] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-serif font-bold text-base text-white">
                Commit Dataset to BritConnect Storage
              </h4>
              <p className="text-xs text-[#DCE6F3] mt-1">
                Data persists in IndexedDB. Select your preferred import strategy:
              </p>

              {hasExistingData && (
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge_upsert"
                      checked={importMode === 'merge_upsert'}
                      onChange={() => setImportMode('merge_upsert')}
                      className="text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    <span>Append / Merge (Upsert by ID)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    <span>Replace Entire Dataset</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="score_only"
                      checked={importMode === 'score_only'}
                      onChange={() => setImportMode('score_only')}
                      className="text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    <span>Score-Only (Preserve Training Data)</span>
                  </label>
                </div>
              )}
            </div>

            <button
              onClick={handleCommit}
              className="px-6 py-2.5 bg-[#C9A227] hover:bg-[#E5C566] text-[#0B1F3A] font-bold text-xs rounded-lg flex items-center gap-2 transition shadow-md shrink-0"
            >
              <span>Commit & Clean Dataset</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
