/**
 * BritConnect AI Customer Churn Intelligence Platform
 * Lead Architecture & Orchestrator
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  RawCustomerRecord,
  CleanedCustomerRecord,
  TrainedModelSummary,
  CampaignRecord,
  CleaningActionLog,
  GlobalFilterState,
  BusinessAssumptions,
  DatasetVersionMeta,
} from './types/telecom';
import {
  getRawDataset,
  saveRawDataset,
  getCleanedDataset,
  saveCleanedDataset,
  getTrainedModels,
  saveTrainedModel,
  getCampaigns,
  saveCampaign,
  getCleaningLogs,
  saveCleaningLogs,
  getRejectedRows,
  saveRejectedRows,
  getAppState,
  setAppState,
  saveDatasetVersion,
  DEFAULT_BUSINESS_ASSUMPTIONS,
} from './services/db';
import { runCleaningPipeline, DEFAULT_CLEANING_OPTIONS, CleaningOptions } from './services/dataCleaning';
import { trainAndEvaluateAllModels } from './services/mlEngine';
import { scoreCustomers } from './services/customerScoring';
import { generateBritConnectSampleDataset } from './services/sampleDataGenerator';
import { ALL_CANDIDATE_FEATURES } from './services/featureEngineering';

// Components
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalFilterBar } from './components/layout/GlobalFilterBar';
import { OverviewDashboard } from './components/views/OverviewDashboard';
import { UploadCentre } from './components/views/UploadCentre';
import { DataQualityView } from './components/views/DataQualityView';
import { ChurnDriversView } from './components/views/ChurnDriversView';
import { SegmentationView } from './components/views/SegmentationView';
import { CustomerScoringView } from './components/views/CustomerScoringView';
import { CampaignsView } from './components/views/CampaignsView';
import { RetentionActionCentre } from './components/views/RetentionActionCentre';
import { AiAssistantView } from './components/views/AiAssistantView';
import { ModelStudioView } from './components/views/ModelStudioView';
import { ReportsView } from './components/views/ReportsView';
import { DataManagementView } from './components/views/DataManagementView';
import { SettingsView } from './components/views/SettingsView';

import {
  UploadCloud,
  CheckCircle2,
  Cpu,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Database,
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isLoadingApp, setIsLoadingApp] = useState(true);

  // Application Data States
  const [rawRecords, setRawRecords] = useState<RawCustomerRecord[]>([]);
  const [cleanedRecords, setCleanedRecords] = useState<CleanedCustomerRecord[]>([]);
  const [models, setModels] = useState<TrainedModelSummary[]>([]);
  const [championModel, setChampionModel] = useState<TrainedModelSummary | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [cleaningLogs, setCleaningLogs] = useState<CleaningActionLog[]>([]);
  const [rejectedRows, setRejectedRows] = useState<any[]>([]);
  const [assumptions, setAssumptions] = useState<BusinessAssumptions>(DEFAULT_BUSINESS_ASSUMPTIONS);
  const [cleaningOptions, setCleaningOptions] = useState<CleaningOptions>(DEFAULT_CLEANING_OPTIONS);

  // Status & Navigation helpers
  const [isModelStale, setIsModelStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('07/11/2026 09:30');
  const [selectedCustomerIdFor360, setSelectedCustomerIdFor360] = useState<string | null>(null);

  // Global Filter State
  const [filters, setFilters] = useState<GlobalFilterState>({
    segment: '',
    serviceType: '',
    planName: '',
    nation: '',
    city: '',
    channel: '',
    contractType: '',
    ageBand: '',
    gender: '',
    riskTier: '',
    joinDateFrom: '',
    joinDateTo: '',
    searchQuery: '',
  });

  // Restore State on Mount from IndexedDB
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedRaw = await getRawDataset();
        const storedCleaned = await getCleanedDataset();
        const storedModels = await getTrainedModels();
        const storedCampaigns = await getCampaigns();
        const storedLogs = await getCleaningLogs();
        const storedRejects = await getRejectedRows();
        const storedAssumptions = await getAppState<BusinessAssumptions>('assumptions');

        if (storedAssumptions) setAssumptions(storedAssumptions);
        if (storedLogs) setCleaningLogs(storedLogs);
        if (storedRejects) setRejectedRows(storedRejects);
        if (storedCampaigns) setCampaigns(storedCampaigns);

        if (storedModels && storedModels.length > 0) {
          setModels(storedModels);
          const champ = storedModels.find((m) => m.isChampion) || storedModels[0];
          setChampionModel(champ);
        }

        if (storedRaw && storedRaw.length > 0) {
          setRawRecords(storedRaw);
          if (storedCleaned && storedCleaned.length > 0) {
            setCleanedRecords(storedCleaned);
          } else {
            // Run cleaning on raw
            const res = runCleaningPipeline(storedRaw, cleaningOptions);
            setCleanedRecords(res.cleanedRecords);
          }
        }
      } catch (e) {
        console.error('Error restoring session from IndexedDB:', e);
      } finally {
        setIsLoadingApp(false);
      }
    }

    restoreSession();
  }, []);

  // One-click Demo Dataset Initializer
  const handleLoadDemoDataset = async () => {
    setIsLoadingApp(true);
    const demo = generateBritConnectSampleDataset(1000, 2026);
    await saveRawDataset(demo);
    setRawRecords(demo);

    // Clean data
    const { cleanedRecords: clean, logs, rejectedRows: rej } = runCleaningPipeline(demo, cleaningOptions);
    await saveCleanedDataset(clean);
    await saveCleaningLogs(logs);
    await saveRejectedRows(rej);
    setCleanedRecords(clean);
    setCleaningLogs(logs);
    setRejectedRows(rej);

    // Train ML models
    const selectedFeatureKeys = ALL_CANDIDATE_FEATURES.filter((f) => f.defaultIncluded).map((f) => f.key);
    const trained = await trainAndEvaluateAllModels(clean, selectedFeatureKeys, 'demo-v1');
    for (const m of trained) {
      await saveTrainedModel(m);
    }
    setModels(trained);
    const champ = trained.find((m) => m.isChampion) || trained[0];
    setChampionModel(champ);

    // Score active subscribers
    const scored = scoreCustomers(clean, champ, assumptions);
    await saveCleanedDataset(scored);
    setCleanedRecords(scored);

    // Record dataset version
    await saveDatasetVersion({
      id: `ver-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileName: 'BritConnect_Synthetic_Customer_Base_1000.csv',
      rowCount: 1000,
      action: 'initial_upload',
      addedRows: 1000,
      updatedRows: 0,
      rejectedRows: 0,
    });

    setLastUpdated(new Date().toLocaleString('en-GB'));
    setIsLoadingApp(false);
    setCurrentView('dashboard');
  };

  // Commit Data from Upload Centre
  const handleCommitData = async (
    newRows: RawCustomerRecord[],
    action: 'initial_upload' | 'merge_upsert' | 'replace' | 'score_only',
    fileName: string
  ) => {
    setIsLoadingApp(true);
    let finalRaw: RawCustomerRecord[] = [];
    let addedCount = newRows.length;
    let updatedCount = 0;

    if (action === 'replace' || action === 'initial_upload') {
      finalRaw = newRows;
    } else if (action === 'merge_upsert') {
      const existingMap = new Map<string, RawCustomerRecord>();
      rawRecords.forEach((r) => existingMap.set(String(r['Customer ID'] || r.id), r));

      addedCount = 0;
      updatedCount = 0;
      for (const row of newRows) {
        const id = String(row['Customer ID'] || row.id);
        if (existingMap.has(id)) {
          updatedCount++;
        } else {
          addedCount++;
        }
        existingMap.set(id, row);
      }
      finalRaw = Array.from(existingMap.values());
    } else {
      // Score-only
      finalRaw = newRows;
    }

    await saveRawDataset(finalRaw);
    setRawRecords(finalRaw);

    // Clean
    const { cleanedRecords: clean, logs, rejectedRows: rej } = runCleaningPipeline(finalRaw, cleaningOptions);
    await saveCleanedDataset(clean);
    await saveCleaningLogs(logs);
    await saveRejectedRows(rej);
    setCleanedRecords(clean);
    setCleaningLogs(logs);
    setRejectedRows(rej);

    // Auto-train if no models exist, or flag stale
    if (models.length === 0) {
      const selectedFeatureKeys = ALL_CANDIDATE_FEATURES.filter((f) => f.defaultIncluded).map((f) => f.key);
      const trained = await trainAndEvaluateAllModels(clean, selectedFeatureKeys, `v-${Date.now()}`);
      for (const m of trained) await saveTrainedModel(m);
      setModels(trained);
      const champ = trained.find((m) => m.isChampion) || trained[0];
      setChampionModel(champ);
      const scored = scoreCustomers(clean, champ, assumptions);
      await saveCleanedDataset(scored);
      setCleanedRecords(scored);
      setIsModelStale(false);
    } else {
      if (championModel) {
        const scored = scoreCustomers(clean, championModel, assumptions);
        await saveCleanedDataset(scored);
        setCleanedRecords(scored);
      }
      setIsModelStale(true);
    }

    await saveDatasetVersion({
      id: `ver-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileName,
      rowCount: finalRaw.length,
      action,
      addedRows: addedCount,
      updatedRows: updatedCount,
      rejectedRows: rej.length,
    });

    setLastUpdated(new Date().toLocaleString('en-GB'));
    setIsLoadingApp(false);
    setCurrentView('dashboard');
  };

  // Re-run Cleaning Pipeline with updated options
  const handleRerunCleaning = async (opts: CleaningOptions) => {
    setCleaningOptions(opts);
    const { cleanedRecords: clean, logs, rejectedRows: rej } = runCleaningPipeline(rawRecords, opts);
    let finalCleaned = clean;
    if (championModel) {
      finalCleaned = scoreCustomers(clean, championModel, assumptions);
    }
    await saveCleanedDataset(finalCleaned);
    await saveCleaningLogs(logs);
    await saveRejectedRows(rej);
    setCleanedRecords(finalCleaned);
    setCleaningLogs(logs);
    setRejectedRows(rej);
  };

  // Re-train models from scratch
  const handleRetrainModels = async () => {
    setIsLoadingApp(true);
    const selectedFeatureKeys = ALL_CANDIDATE_FEATURES.filter((f) => f.defaultIncluded).map((f) => f.key);
    const trained = await trainAndEvaluateAllModels(cleanedRecords, selectedFeatureKeys, `v-${Date.now()}`);
    for (const m of trained) await saveTrainedModel(m);
    setModels(trained);
    const champ = trained.find((m) => m.isChampion) || trained[0];
    setChampionModel(champ);
    const scored = scoreCustomers(cleanedRecords, champ, assumptions);
    await saveCleanedDataset(scored);
    setCleanedRecords(scored);
    setIsModelStale(false);
    setIsLoadingApp(false);
  };

  // Set Champion Model
  const handleSetChampionModel = async (newChamp: TrainedModelSummary) => {
    const updated = models.map((m) => ({ ...m, isChampion: m.id === newChamp.id }));
    setModels(updated);
    setChampionModel(newChamp);
    for (const m of updated) await saveTrainedModel(m);
    const scored = scoreCustomers(cleanedRecords, newChamp, assumptions);
    await saveCleanedDataset(scored);
    setCleanedRecords(scored);
  };

  // Save Campaign
  const handleSaveCampaign = async (camp: CampaignRecord) => {
    await saveCampaign(camp);
    setCampaigns((prev) => {
      const idx = prev.findIndex((c) => c.id === camp.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = camp;
        return copy;
      }
      return [camp, ...prev];
    });
  };

  // Update Assumptions
  const handleUpdateAssumptions = async (newAssumptions: BusinessAssumptions) => {
    setAssumptions(newAssumptions);
    await setAppState('assumptions', newAssumptions);
    if (championModel) {
      const scored = scoreCustomers(cleanedRecords, championModel, newAssumptions);
      await saveCleanedDataset(scored);
      setCleanedRecords(scored);
    }
  };

  // Wipe All Data
  const handleDataWiped = () => {
    setRawRecords([]);
    setCleanedRecords([]);
    setModels([]);
    setChampionModel(null);
    setCampaigns([]);
    setCleaningLogs([]);
    setRejectedRows([]);
    setCurrentView('upload');
  };

  // Global Filter Logic
  const filteredCustomers = useMemo(() => {
    return cleanedRecords.filter((c) => {
      if (filters.segment && c.segment !== filters.segment) return false;
      if (filters.serviceType && c.serviceType !== filters.serviceType) return false;
      if (filters.nation && c.nation !== filters.nation) return false;
      if (filters.contractType && c.contractType !== filters.contractType) return false;
      if (filters.riskTier && c.riskTier !== filters.riskTier) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (!c.id.toLowerCase().includes(q) && !c.city.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [cleanedRecords, filters]);

  // Available unique filter values
  const availableOptions = useMemo(() => {
    return {
      segments: Array.from(new Set(cleanedRecords.map((c) => c.segment).filter(Boolean))),
      serviceTypes: Array.from(new Set(cleanedRecords.map((c) => c.serviceType).filter(Boolean))),
      nations: Array.from(new Set(cleanedRecords.map((c) => c.nation).filter(Boolean))),
      contractTypes: Array.from(new Set(cleanedRecords.map((c) => c.contractType).filter(Boolean))),
      riskTiers: ['Critical', 'High', 'Medium', 'Low'],
    };
  }, [cleanedRecords]);

  const filtersAppliedDesc = useMemo(() => {
    const parts = [];
    if (filters.segment) parts.push(`Segment: ${filters.segment}`);
    if (filters.serviceType) parts.push(`Service: ${filters.serviceType}`);
    if (filters.nation) parts.push(`Nation: ${filters.nation}`);
    if (filters.contractType) parts.push(`Contract: ${filters.contractType}`);
    if (filters.riskTier) parts.push(`Risk: ${filters.riskTier}`);
    return parts.length > 0 ? parts.join(' · ') : 'Global Active Base';
  }, [filters]);

  const hasData = cleanedRecords.length > 0;
  const hasTrainedModel = championModel !== null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6F8] text-[#1A2233]">
      {/* Top Bar Header */}
      <TopBar
        lastUpdated={lastUpdated}
        totalCustomers={cleanedRecords.length}
        isModelStale={isModelStale}
        onRetrainModel={handleRetrainModels}
        onNavigate={setCurrentView}
        onSearchCustomer={(id) => {
          setSelectedCustomerIdFor360(id);
          setCurrentView('scoring');
        }}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navy Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          hasData={hasData}
          hasTrainedModel={hasTrainedModel}
        />

        {/* Content Body Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Global Filter Bar (Shown on data views) */}
          {hasData && (
            <GlobalFilterBar
              filters={filters}
              onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
              onResetFilters={() =>
                setFilters({
                  segment: '',
                  serviceType: '',
                  planName: '',
                  nation: '',
                  city: '',
                  channel: '',
                  contractType: '',
                  ageBand: '',
                  gender: '',
                  riskTier: '',
                  joinDateFrom: '',
                  joinDateTo: '',
                  searchQuery: '',
                })
              }
              totalCount={cleanedRecords.length}
              filteredCount={filteredCustomers.length}
              availableOptions={availableOptions}
            />
          )}

          {/* Views Container */}
          <main className="flex-1 p-6">
            {isLoadingApp ? (
              <div className="h-96 flex flex-col items-center justify-center gap-3 text-xs text-[#5B6575]">
                <div className="w-10 h-10 border-3 border-[#0B1F3A] border-t-[#C9A227] rounded-full animate-spin" />
                <span className="font-semibold text-sm text-[#0B1F3A]">
                  Initialising BritConnect Intelligence Engine...
                </span>
              </div>
            ) : !hasData && currentView !== 'upload' ? (
              // GUIDED EMPTY STATE STEPPER (Section 9.2)
              <div className="max-w-3xl mx-auto my-10 bg-white rounded-2xl border border-[#E3E7EE] p-8 shadow-sm">
                <div className="text-center max-w-xl mx-auto mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B1F3A] text-[#C9A227] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="font-serif font-bold text-2xl text-[#0B1F3A]">
                    Welcome to BritConnect AI
                  </h2>
                  <p className="text-xs text-[#5B6575] mt-1.5 leading-relaxed">
                    Customer Churn Intelligence Platform for UK Telecommunications. Get started by uploading your raw subscriber base or launch the 1,000-subscriber demo cohort.
                  </p>
                </div>

                {/* 4-Step Stepper */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-8">
                  <div className="p-3 rounded-xl bg-[#F4F7FB] border border-[#1D4C8F]/20">
                    <div className="w-6 h-6 rounded-full bg-[#0B1F3A] text-[#C9A227] font-bold flex items-center justify-center mb-2">
                      1
                    </div>
                    <strong className="text-[#0B1F3A] block">Upload Data</strong>
                    <span className="text-[11px] text-[#5B6575]">
                      Ingest Excel, CSV, or load the built-in synthetic base.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-[#E3E7EE]">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-[#5B6575] font-bold flex items-center justify-center mb-2">
                      2
                    </div>
                    <strong className="text-[#0B1F3A] block">Validate & Clean</strong>
                    <span className="text-[11px] text-[#5B6575]">
                      Automated imputation, deduplication, and quality scoring.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-[#E3E7EE]">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-[#5B6575] font-bold flex items-center justify-center mb-2">
                      3
                    </div>
                    <strong className="text-[#0B1F3A] block">Train Models</strong>
                    <span className="text-[11px] text-[#5B6575]">
                      Evaluate 4 ML algorithms with stratified 5-fold CV.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-[#E3E7EE]">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-[#5B6575] font-bold flex items-center justify-center mb-2">
                      4
                    </div>
                    <strong className="text-[#0B1F3A] block">Insights & Action</strong>
                    <span className="text-[11px] text-[#5B6575]">
                      Executive KPIs, What-If simulation, and playbooks.
                    </span>
                  </div>
                </div>

                {/* Stepper Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={handleLoadDemoDataset}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#C9A227] hover:bg-[#E5C566] text-[#0B1F3A] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <Database className="w-4 h-4" />
                    <span>Load BritConnect Demo Dataset (1,000 Customers)</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('upload')}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#0B1F3A] hover:bg-[#12305A] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <UploadCloud className="w-4 h-4 text-[#C9A227]" />
                    <span>Upload Custom File (.xlsx, .csv)</span>
                  </button>
                </div>
              </div>
            ) : (
              // ACTIVE PAGES ROUTING
              <>
                {currentView === 'dashboard' && (
                  <OverviewDashboard
                    customers={filteredCustomers}
                    allActiveCustomers={cleanedRecords.filter((c) => c.churnFlag === 0)}
                    filtersAppliedDesc={filtersAppliedDesc}
                    onNavigate={setCurrentView}
                    onSelectCustomer={(id) => {
                      setSelectedCustomerIdFor360(id);
                      setCurrentView('scoring');
                    }}
                  />
                )}

                {currentView === 'upload' && (
                  <UploadCentre
                    onCommitData={handleCommitData}
                    hasExistingData={rawRecords.length > 0}
                    existingRowCount={rawRecords.length}
                  />
                )}

                {currentView === 'quality' && (
                  <DataQualityView
                    cleanedCustomers={filteredCustomers}
                    cleaningLogs={cleaningLogs}
                    rejectedRows={rejectedRows}
                    cleaningOptions={cleaningOptions}
                    onUpdateOptionsAndRerun={handleRerunCleaning}
                  />
                )}

                {currentView === 'drivers' && (
                  <ChurnDriversView
                    customers={filteredCustomers}
                    activeModel={championModel}
                    filtersAppliedDesc={filtersAppliedDesc}
                  />
                )}

                {currentView === 'segmentation' && (
                  <SegmentationView
                    customers={filteredCustomers}
                    onNavigateToCustomers={(segName) => {
                      setFilters((prev) => ({ ...prev, segment: segName.includes('Business') ? 'Small Business' : '' }));
                      setCurrentView('scoring');
                    }}
                    onCreateCampaignFromSegment={(seg) => {
                      setCurrentView('campaigns');
                    }}
                  />
                )}

                {currentView === 'scoring' && (
                  <CustomerScoringView
                    customers={filteredCustomers}
                    activeModel={championModel}
                    assumptions={assumptions}
                    selectedCustomerId={selectedCustomerIdFor360}
                    onClearSelectedCustomer={() => setSelectedCustomerIdFor360(null)}
                    onCreateCampaignForCustomer={(c) => setCurrentView('campaigns')}
                  />
                )}

                {currentView === 'campaigns' && (
                  <CampaignsView
                    campaigns={campaigns}
                    allActiveCustomers={cleanedRecords.filter((c) => c.churnFlag === 0)}
                    onSaveCampaign={handleSaveCampaign}
                  />
                )}

                {currentView === 'action_centre' && (
                  <RetentionActionCentre
                    customers={filteredCustomers}
                    assumptions={assumptions}
                    onCreateCampaignFromRecommendation={(rec) => setCurrentView('campaigns')}
                  />
                )}

                {currentView === 'ai_assistant' && (
                  <AiAssistantView
                    customers={filteredCustomers}
                    allActiveCustomers={cleanedRecords.filter((c) => c.churnFlag === 0)}
                  />
                )}

                {currentView === 'models' && (
                  <ModelStudioView
                    customers={cleanedRecords}
                    models={models}
                    activeModel={championModel}
                    assumptions={assumptions}
                    onSetChampionModel={handleSetChampionModel}
                    onModelsTrained={(newModels) => {
                      setModels(newModels);
                      const champ = newModels.find((m) => m.isChampion) || newModels[0];
                      setChampionModel(champ);
                      const scored = scoreCustomers(cleanedRecords, champ, assumptions);
                      setCleanedRecords(scored);
                    }}
                  />
                )}

                {currentView === 'reports' && (
                  <ReportsView
                    customers={filteredCustomers}
                    activeModel={championModel}
                    cleaningLogs={cleaningLogs}
                    filtersAppliedDesc={filtersAppliedDesc}
                  />
                )}

                {currentView === 'data_management' && (
                  <DataManagementView
                    customers={cleanedRecords}
                    onDataWiped={handleDataWiped}
                  />
                )}

                {currentView === 'settings' && (
                  <SettingsView
                    assumptions={assumptions}
                    onUpdateAssumptions={handleUpdateAssumptions}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
