/**
 * Data Ingestion, Parsing, Fuzzy Mapping and Validation Engine
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  RawCustomerRecord,
  ValidationReport,
  ValidationIssue,
  ColumnSchemaDefinition,
} from '../types/telecom';
import {
  AUTHORITATIVE_COLUMNS,
  matchHeaderToSchema,
  normaliseHeader,
} from './schemaRegistry';

export interface ParsedFileResult {
  fileName: string;
  fileSize: number;
  sheets?: string[];
  selectedSheet?: string;
  rawHeaders: string[];
  rawRows: any[];
  previewRows: any[];
  mapping: Record<string, string>; // incomingHeader -> authoritativeColumnName
  unmappedHeaders: string[];
}

/**
 * Detect delimiter from text sample
 */
export function detectDelimiter(text: string): string {
  const sample = text.slice(0, 5000);
  const commaCount = (sample.match(/,/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;
  const semiCount = (sample.match(/;/g) || []).length;
  const pipeCount = (sample.match(/\|/g) || []).length;

  const max = Math.max(commaCount, tabCount, semiCount, pipeCount);
  if (max === tabCount && tabCount > 0) return '\t';
  if (max === semiCount && semiCount > 0) return ';';
  if (max === pipeCount && pipeCount > 0) return '|';
  return ',';
}

/**
 * Parse an uploaded File object (Excel, CSV, TSV, JSON, NDJSON)
 */
export async function parseUploadedFile(file: File, sheetName?: string): Promise<ParsedFileResult> {
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['xlsx', 'xls', 'xlsm', 'ods'].includes(ext)) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const sheets = workbook.SheetNames;
    const targetSheet = sheetName && sheets.includes(sheetName) ? sheetName : sheets[0];
    const worksheet = workbook.Sheets[targetSheet];

    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
      dateNF: 'yyyy-mm-dd',
    });

    const rawHeaders = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
    const mapping = autoMapHeaders(rawHeaders);
    const unmappedHeaders = rawHeaders.filter((h) => !mapping[h]);

    return {
      fileName,
      fileSize: file.size,
      sheets,
      selectedSheet: targetSheet,
      rawHeaders,
      rawRows,
      previewRows: rawRows.slice(0, 20),
      mapping,
      unmappedHeaders,
    };
  } else if (['csv', 'tsv', 'txt'].includes(ext)) {
    const text = await file.text();
    // Strip UTF-8 BOM if present
    const cleanText = text.replace(/^\uFEFF/, '');
    const delimiter = ext === 'tsv' ? '\t' : detectDelimiter(cleanText);

    return new Promise((resolve, reject) => {
      Papa.parse(cleanText, {
        header: true,
        delimiter,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
        complete: (results) => {
          const rawRows = results.data as any[];
          const rawHeaders = results.meta.fields || (rawRows.length > 0 ? Object.keys(rawRows[0]) : []);
          const mapping = autoMapHeaders(rawHeaders);
          const unmappedHeaders = rawHeaders.filter((h) => !mapping[h]);

          resolve({
            fileName,
            fileSize: file.size,
            rawHeaders,
            rawRows,
            previewRows: rawRows.slice(0, 20),
            mapping,
            unmappedHeaders,
          });
        },
        error: (err: any) => reject(new Error(`CSV Parsing Error: ${err?.message || String(err)}`)),
      });
    });
  } else if (ext === 'json' || ext === 'ndjson') {
    const text = await file.text();
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    let rawRows: any[] = [];

    if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
      rawRows = JSON.parse(cleanText);
    } else if (cleanText.includes('\n')) {
      // NDJSON line by line
      rawRows = cleanText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => JSON.parse(l));
    } else {
      const parsed = JSON.parse(cleanText);
      rawRows = Array.isArray(parsed) ? parsed : parsed.data || [parsed];
    }

    const rawHeaders = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
    const mapping = autoMapHeaders(rawHeaders);
    const unmappedHeaders = rawHeaders.filter((h) => !mapping[h]);

    return {
      fileName,
      fileSize: file.size,
      rawHeaders,
      rawRows,
      previewRows: rawRows.slice(0, 20),
      mapping,
      unmappedHeaders,
    };
  }

  throw new Error(`Unsupported file extension: .${ext}. Please upload .xlsx, .xls, .csv, .tsv, or .json`);
}

/**
 * Automatically map raw headers to authoritative 38 columns using fuzzy logic
 */
export function autoMapHeaders(rawHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const mappedTargets = new Set<string>();

  for (const h of rawHeaders) {
    const match = matchHeaderToSchema(h);
    if (match.matchedColumn && match.confidence >= 0.6 && !mappedTargets.has(match.matchedColumn.name)) {
      mapping[h] = match.matchedColumn.name;
      mappedTargets.add(match.matchedColumn.name);
    }
  }

  return mapping;
}

/**
 * Apply column mapping to transform raw rows into standardized RawCustomerRecord array
 */
export function applyMapping(rawRows: any[], mapping: Record<string, string>): RawCustomerRecord[] {
  return rawRows.map((row) => {
    const standardRow: Record<string, any> = {};

    for (const [rawKey, val] of Object.entries(row)) {
      const canonicalKey = mapping[rawKey];
      if (canonicalKey) {
        standardRow[canonicalKey] = val;
      } else {
        // Keep extra unmapped columns in record
        standardRow[rawKey] = val;
      }
    }

    // Target derivation: if Churn Status is present but Churn Flag missing
    if (standardRow['Churn Flag'] === undefined || standardRow['Churn Flag'] === '') {
      if (standardRow['Churn Status']) {
        const s = String(standardRow['Churn Status']).toLowerCase().trim();
        standardRow['Churn Flag'] = s === 'churned' || s === '1' || s === 'yes' ? 1 : 0;
      }
    }

    // Target derivation: if Churn Flag is present but Churn Status missing
    if (!standardRow['Churn Status'] && standardRow['Churn Flag'] !== undefined) {
      const f = Number(standardRow['Churn Flag']);
      standardRow['Churn Status'] = f === 1 ? 'Churned' : 'Active';
    }

    return standardRow as RawCustomerRecord;
  });
}

/**
 * Run Comprehensive Data Validation Report on mapped records
 */
export function validateDataset(records: RawCustomerRecord[]): ValidationReport {
  const totalRows = records.length;
  const totalColumns = AUTHORITATIVE_COLUMNS.length;

  if (totalRows === 0) {
    return {
      dataQualityScore: 0,
      totalRows: 0,
      totalColumns,
      missingRequiredColumns: ['Customer ID', 'Churn Flag'],
      unmappedColumns: [],
      duplicateIdCount: 0,
      duplicateIdSamples: [],
      columnMissingness: [],
      rangeIssues: [],
      categoricalIssues: [],
      consistencyIssues: [],
      dateIssues: [],
      targetClassBalance: { active: 0, churned: 0, churnRate: 0 },
      detectedNpsScale: 'unknown',
      canTrain: false,
      canScore: false,
    };
  }

  // 1. Check columns presence
  const availableColumns = new Set(Object.keys(records[0]));
  const missingRequiredColumns: string[] = [];
  if (!availableColumns.has('Customer ID')) missingRequiredColumns.push('Customer ID');
  const hasTarget = availableColumns.has('Churn Flag') || availableColumns.has('Churn Status');
  if (!hasTarget) missingRequiredColumns.push('Churn Flag or Churn Status');

  // 2. Duplicate IDs
  const idCounts = new Map<string, number>();
  const duplicateIdSamples: string[] = [];
  for (const r of records) {
    const id = String(r['Customer ID'] || '').trim();
    if (id) {
      const c = (idCounts.get(id) || 0) + 1;
      idCounts.set(id, c);
      if (c === 2 && duplicateIdSamples.length < 5) {
        duplicateIdSamples.push(id);
      }
    }
  }
  let duplicateIdCount = 0;
  idCounts.forEach((c) => {
    if (c > 1) duplicateIdCount += c - 1;
  });

  // 3. Column missingness
  const columnMissingness = AUTHORITATIVE_COLUMNS.map((col) => {
    let emptyCount = 0;
    records.forEach((r) => {
      const v = r[col.name];
      if (v === undefined || v === null || String(v).trim() === '') {
        emptyCount++;
      }
    });
    return {
      column: col.name,
      count: emptyCount,
      percentage: Math.round((emptyCount / totalRows) * 1000) / 10,
    };
  });

  // 4. Range and Type Checks
  const rangeIssues: ValidationIssue[] = [];
  let ageBad = 0;
  let csatBad = 0;
  let negativeCharges = 0;
  let discountBad = 0;

  // NPS Scale detection
  let npsMin = Infinity;
  let npsMax = -Infinity;

  records.forEach((r) => {
    const age = Number(r['Age']);
    if (!isNaN(age) && r['Age'] !== '' && (age < 16 || age > 110)) ageBad++;

    const csat = Number(r['Satisfaction Score 1 10']);
    if (!isNaN(csat) && r['Satisfaction Score 1 10'] !== '' && (csat < 1 || csat > 10)) csatBad++;

    const charge = Number(r['Monthly Charge GBP']);
    if (!isNaN(charge) && charge < 0) negativeCharges++;

    const disc = Number(r['Discount Percent']);
    if (!isNaN(disc) && r['Discount Percent'] !== '' && (disc < 0 || disc > 100)) discountBad++;

    const nps = Number(r['NPS Score']);
    if (!isNaN(nps) && r['NPS Score'] !== '') {
      if (nps < npsMin) npsMin = nps;
      if (nps > npsMax) npsMax = nps;
    }
  });

  if (ageBad > 0) rangeIssues.push({ severity: 'Warning', column: 'Age', message: `Values outside realistic 16-110 age window`, count: ageBad });
  if (csatBad > 0) rangeIssues.push({ severity: 'Error', column: 'Satisfaction Score 1 10', message: `Scores outside the 1 to 10 scale`, count: csatBad });
  if (negativeCharges > 0) rangeIssues.push({ severity: 'Error', column: 'Monthly Charge GBP', message: `Negative monthly charge detected`, count: negativeCharges });
  if (discountBad > 0) rangeIssues.push({ severity: 'Warning', column: 'Discount Percent', message: `Discount outside 0% to 100% bounds`, count: discountBad });

  let detectedNpsScale: '-100..100' | '0..10' | 'unknown' = 'unknown';
  if (npsMin >= 0 && npsMax <= 10) detectedNpsScale = '0..10';
  else if (npsMin < 0 || npsMax > 10) detectedNpsScale = '-100..100';

  // 5. Categorical Checks
  const categoricalIssues: ValidationIssue[] = [];
  let invalidStatusCount = 0;
  records.forEach((r) => {
    const s = String(r['Churn Status'] || '').trim().toLowerCase();
    if (s && !['active', 'churned'].includes(s)) invalidStatusCount++;
  });
  if (invalidStatusCount > 0) {
    categoricalIssues.push({
      severity: 'Error',
      column: 'Churn Status',
      message: `Unrecognised churn status (expected 'Active' or 'Churned')`,
      count: invalidStatusCount,
    });
  }

  // 6. Consistency Checks
  const consistencyIssues: ValidationIssue[] = [];
  let targetConflictCount = 0;
  let activeWithReasonCount = 0;
  let overageWithoutUsageCount = 0;

  records.forEach((r) => {
    const flag = Number(r['Churn Flag']);
    const status = String(r['Churn Status'] || '').trim().toLowerCase();
    if ((flag === 1 && status === 'active') || (flag === 0 && status === 'churned')) {
      targetConflictCount++;
    }
    if (status === 'active' && (r['Churn Reason'] || r['Churn Date'])) {
      activeWithReasonCount++;
    }
    const usage = Number(r['Average Monthly Usage GB']);
    const allow = Number(r['Data Allowance GB']);
    const overage = Number(r['Overage Charges GBP']);
    if (overage > 0 && !isNaN(usage) && !isNaN(allow) && usage <= allow) {
      overageWithoutUsageCount++;
    }
  });

  if (targetConflictCount > 0) {
    consistencyIssues.push({
      severity: 'Error',
      column: 'Churn Flag / Status',
      message: `Contradiction between Churn Flag and Churn Status`,
      count: targetConflictCount,
    });
  }
  if (activeWithReasonCount > 0) {
    consistencyIssues.push({
      severity: 'Warning',
      column: 'Churn Reason',
      message: `Active customer has Churn Reason or Churn Date recorded`,
      count: activeWithReasonCount,
    });
  }
  if (overageWithoutUsageCount > 0) {
    consistencyIssues.push({
      severity: 'Info',
      column: 'Overage Charges GBP',
      message: `Overage charge billed while monthly usage did not exceed allowance`,
      count: overageWithoutUsageCount,
    });
  }

  // 7. Date Checks
  const dateIssues: ValidationIssue[] = [];
  let unparseableJoinDates = 0;
  let endBeforeStartCount = 0;
  const refDate = new Date('2026-11-07');

  records.forEach((r) => {
    if (r['Join Date']) {
      const d = parseDateString(String(r['Join Date']));
      if (!d || isNaN(d.getTime())) unparseableJoinDates++;
      else if (d > refDate) {
        // future join date
      }
    }
    if (r['Contract Start Date'] && r['Contract End Date']) {
      const s = parseDateString(String(r['Contract Start Date']));
      const e = parseDateString(String(r['Contract End Date']));
      if (s && e && e < s) endBeforeStartCount++;
    }
  });

  if (unparseableJoinDates > 0) {
    dateIssues.push({
      severity: 'Warning',
      column: 'Join Date',
      message: `Join dates that could not be parsed to DD/MM/YYYY or standard format`,
      count: unparseableJoinDates,
    });
  }
  if (endBeforeStartCount > 0) {
    dateIssues.push({
      severity: 'Error',
      column: 'Contract End Date',
      message: `Contract End Date earlier than Contract Start Date`,
      count: endBeforeStartCount,
    });
  }

  // 8. Target class balance
  let active = 0;
  let churned = 0;
  records.forEach((r) => {
    const f = Number(r['Churn Flag']);
    if (f === 1) churned++;
    else active++;
  });
  const churnRate = totalRows > 0 ? Math.round((churned / totalRows) * 1000) / 10 : 0;

  // 9. Data Quality Score (0-100)
  // Deductions:
  // - Missing required columns: -30 each
  // - Duplicate IDs: -1 per 1% duplicate rate
  // - High missingness on critical features: up to -20
  // - Range errors: -10
  // - Consistency errors: -10
  let qualityScore = 100;
  if (missingRequiredColumns.length > 0) qualityScore -= missingRequiredColumns.length * 30;
  if (duplicateIdCount > 0) qualityScore -= Math.min(20, Math.ceil((duplicateIdCount / totalRows) * 100));
  if (rangeIssues.some((i) => i.severity === 'Error')) qualityScore -= 10;
  if (consistencyIssues.some((i) => i.severity === 'Error')) qualityScore -= 15;
  if (categoricalIssues.some((i) => i.severity === 'Error')) qualityScore -= 10;
  if (dateIssues.some((i) => i.severity === 'Error')) qualityScore -= 10;

  // Missingness penalty
  const avgMissingPct = columnMissingness.reduce((acc, c) => acc + c.percentage, 0) / columnMissingness.length;
  qualityScore -= Math.min(15, Math.round(avgMissingPct * 0.5));
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  const canTrain = missingRequiredColumns.length === 0 && churned >= 5 && active >= 5;
  const canScore = availableColumns.has('Customer ID');

  return {
    dataQualityScore: qualityScore,
    totalRows,
    totalColumns,
    missingRequiredColumns,
    unmappedColumns: [],
    duplicateIdCount,
    duplicateIdSamples,
    columnMissingness,
    rangeIssues,
    categoricalIssues,
    consistencyIssues,
    dateIssues,
    targetClassBalance: { active, churned, churnRate },
    detectedNpsScale,
    canTrain,
    canScore,
  };
}

/**
 * Universal date parser supporting UK DD/MM/YYYY, ISO YYYY-MM-DD, Excel serials
 */
export function parseDateString(dateVal: any): Date | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal;

  // Excel serial number
  if (typeof dateVal === 'number' && dateVal > 25569) {
    return new Date((dateVal - 25569) * 86400 * 1000);
  }

  const s = String(dateVal).trim();
  if (!s) return null;

  // DD/MM/YYYY or DD-MM-YYYY
  const ukMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (ukMatch) {
    const day = parseInt(ukMatch[1], 10);
    const month = parseInt(ukMatch[2], 10) - 1;
    const year = parseInt(ukMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format date to standard UK DD/MM/YYYY
 */
export function formatUkDate(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const dateObj = typeof d === 'string' ? parseDateString(d) : d;
  if (!dateObj || isNaN(dateObj.getTime())) return String(d);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}
