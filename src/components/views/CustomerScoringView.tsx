/**
 * BritConnect Customer Scoring & 360 Profile Hub
 * Section 6.1: Active Customer Scoring, Risk Rank, Customer 360 Drawer,
 * What-If Simulator Levers, and Filtered CSV/XLSX Export.
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Sliders,
  Sparkles,
  ArrowRight,
  X,
  ShieldAlert,
  Calendar,
  PoundSterling,
  RotateCcw,
  UserCheck,
  Check,
} from 'lucide-react';
import {
  CleanedCustomerRecord,
  TrainedModelSummary,
  BusinessAssumptions,
  RiskTier,
} from '../../types/telecom';
import { simulateCustomerWhatIf, WhatIfLevers } from '../../services/customerScoring';
import { exportCustomerListExcel, exportCustomerListCsv } from '../../services/reportGenerator';

interface CustomerScoringViewProps {
  customers: CleanedCustomerRecord[];
  activeModel: TrainedModelSummary | null;
  assumptions: BusinessAssumptions;
  selectedCustomerId?: string | null;
  onClearSelectedCustomer: () => void;
  onCreateCampaignForCustomer: (c: CleanedCustomerRecord) => void;
}

export const CustomerScoringView: React.FC<CustomerScoringViewProps> = ({
  customers,
  activeModel,
  assumptions,
  selectedCustomerId,
  onClearSelectedCustomer,
  onCreateCampaignForCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(selectedCustomerId || null);

  // What-If Simulator State for the drawer
  const [whatIfLevers, setWhatIfLevers] = useState<WhatIfLevers>({
    discountPercent: 0,
    extendContractMonths: 0,
    resolveComplaints: false,
    resolveOutages: false,
    upgradeDataAllowance: false,
    autoRenewToggle: false,
  });

  // Filter scored active customers
  const activeCustomers = customers.filter((c) => c.churnFlag === 0);

  const filtered = activeCustomers.filter((c) => {
    if (tierFilter !== 'All' && c.riskTier !== tierFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.planName.toLowerCase().includes(q) ||
        c.serviceType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Active customer for 360 profile drawer
  const targetCustomer = activeCustomers.find((c) => c.id === activeProfileId) || null;

  // Run What-If simulation if target customer is loaded
  const whatIfResult =
    targetCustomer && activeModel
      ? simulateCustomerWhatIf(targetCustomer, activeModel, whatIfLevers, assumptions)
      : null;

  const handleOpen360 = (id: string) => {
    setActiveProfileId(id);
    const c = activeCustomers.find((x) => x.id === id);
    if (c) {
      setWhatIfLevers({
        discountPercent: c.discountPercent,
        extendContractMonths: 0,
        resolveComplaints: false,
        resolveOutages: false,
        upgradeDataAllowance: false,
        autoRenewToggle: c.autoRenew,
      });
    }
  };

  const handleClose360 = () => {
    setActiveProfileId(null);
    onClearSelectedCustomer();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0B1F3A] tracking-tight">
            Customer Scoring & Explainable 360 Profiles
          </h1>
          <p className="text-xs text-[#5B6575] mt-1">
            Section 6.1: Active subscriber churn probability, explainable risk drivers, and interactive what-if simulation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCustomerListExcel(filtered, 'BritConnect_Active_Risk_Register')}
            className="px-3 py-1.5 bg-white border border-[#E3E7EE] hover:bg-[#F5F6F8] text-[#0B1F3A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Scored Excel</span>
          </button>
          <button
            onClick={() => exportCustomerListCsv(filtered)}
            className="px-3 py-1.5 bg-white border border-[#E3E7EE] hover:bg-[#F5F6F8] text-[#0B1F3A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#1D4C8F]" />
            <span>Export Scored CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Customer ID, City, or Tariff Plan..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F5F6F8] border border-[#E3E7EE] rounded-lg text-[#1A2233] placeholder-[#8F9CAE] focus:outline-hidden focus:border-[#C9A227]"
            />
            <Search className="w-4 h-4 text-[#8F9CAE] absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Tier filter buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#5B6575] font-medium mr-1">Risk Tier:</span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                tierFilter === tier
                  ? tier === 'Critical'
                    ? 'bg-[#4D0612] text-white shadow-xs'
                    : tier === 'High'
                    ? 'bg-[#7A0C1E] text-white shadow-xs'
                    : tier === 'Medium'
                    ? 'bg-[#C9A227] text-[#0B1F3A] shadow-xs'
                    : tier === 'Low'
                    ? 'bg-[#0B1F3A] text-white shadow-xs'
                    : 'bg-[#12305A] text-white shadow-xs'
                  : 'bg-[#F5F6F8] text-[#5B6575] hover:bg-[#E3E7EE]'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Scored Customer Table */}
      <div className="bg-white rounded-xl border border-[#E3E7EE] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E3E7EE] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#0B1F3A]">
            Showing {filtered.length.toLocaleString('en-GB')} Active Scored Subscribers
          </span>
          <span className="text-[11px] text-[#5B6575]">
            Click any row to launch full Customer 360 profile and What-If simulator
          </span>
        </div>

        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F5F6F8] text-[#0B1F3A] sticky top-0 border-b border-[#E3E7EE] select-none">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Customer ID</th>
                <th className="py-2.5 px-3 font-semibold">Segment</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold">Service Plan</th>
                <th className="py-2.5 px-3 font-semibold text-right">Monthly £</th>
                <th className="py-2.5 px-3 font-semibold text-center">Churn Prob</th>
                <th className="py-2.5 px-3 font-semibold text-center">Risk Tier</th>
                <th className="py-2.5 px-3 font-semibold text-right">Rev At Risk (£/mo)</th>
                <th className="py-2.5 px-3 font-semibold">Primary Risk Driver</th>
                <th className="py-2.5 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E7EE]">
              {filtered.slice(0, 50).map((c) => {
                const prob = c.churnProbability ?? 0.15;
                const tier = c.riskTier || 'Low';

                return (
                  <tr
                    key={c.id}
                    onClick={() => handleOpen360(c.id)}
                    className="hover:bg-[#F4F7FB] cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 font-bold text-[#0B1F3A] whitespace-nowrap">
                      {c.id}
                    </td>
                    <td className="py-2.5 px-3 text-[#1A2233]">{c.segment}</td>
                    <td className="py-2.5 px-3 text-[#5B6575]">{c.city}, {c.nation}</td>
                    <td className="py-2.5 px-3 text-[#1A2233] max-w-[140px] truncate" title={c.planName}>
                      {c.planName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#0B1F3A]">
                      £{c.effectiveMonthlyCharge.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-[#0B1F3A]">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          tier === 'Critical'
                            ? 'bg-[#4D0612] text-white'
                            : tier === 'High'
                            ? 'bg-[#7A0C1E] text-white'
                            : tier === 'Medium'
                            ? 'bg-[#C9A227] text-[#0B1F3A]'
                            : 'bg-[#DCE6F3] text-[#0B1F3A]'
                        }`}
                      >
                        {tier}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#7A0C1E]">
                      £{(c.expectedMonthlyRevenueAtRisk || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-[#5B6575] max-w-[200px] truncate" title={c.topDrivers?.[0]?.plainEnglish}>
                      {c.topDrivers?.[0]?.plainEnglish || 'Standard usage profile'}
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpen360(c.id)}
                        className="px-2 py-1 text-[11px] font-semibold text-[#1D4C8F] hover:bg-[#DCE6F3] rounded transition"
                      >
                        Profile 360
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* CUSTOMER 360 PROFILE & WHAT-IF SIMULATOR DRAWER      */}
      {/* ==================================================== */}
      {targetCustomer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl border-l border-[#E3E7EE] flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="p-5 bg-[#0B1F3A] text-white flex items-center justify-between sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg">{targetCustomer.id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    targetCustomer.riskTier === 'Critical'
                      ? 'bg-[#7A0C1E] text-white'
                      : targetCustomer.riskTier === 'High'
                      ? 'bg-[#A3152B] text-white'
                      : targetCustomer.riskTier === 'Medium'
                      ? 'bg-[#C9A227] text-[#0B1F3A]'
                      : 'bg-[#DCE6F3] text-[#0B1F3A]'
                  }`}
                >
                  {targetCustomer.riskTier} Risk ({((targetCustomer.churnProbability || 0) * 100).toFixed(1)}%)
                </span>
              </div>
              <p className="text-xs text-[#DCE6F3] mt-0.5">
                {targetCustomer.segment} · {targetCustomer.serviceType} · {targetCustomer.city}, {targetCustomer.nation}
              </p>
            </div>
            <button
              onClick={handleClose360}
              className="p-1.5 text-[#DCE6F3] hover:text-white hover:bg-[#12305A] rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Top Risk Drivers Waterfall */}
            <div className="bg-[#F4F7FB] p-4 rounded-xl border border-[#1D4C8F]/20">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#0B1F3A] mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#7A0C1E]" />
                <span>Explainable Churn Risk Drivers (Local SHAP-Style)</span>
              </h4>
              <div className="space-y-2 mt-2">
                {targetCustomer.topDrivers && targetCustomer.topDrivers.length > 0 ? (
                  targetCustomer.topDrivers.map((driver, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-lg border border-[#E3E7EE] text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            driver.direction === 'risk_increasing' ? 'bg-[#7A0C1E]' : 'bg-emerald-600'
                          }`}
                        />
                        <span className="text-[#1A2233] font-medium">{driver.plainEnglish}</span>
                      </div>
                      <span
                        className={`font-bold text-[11px] ${
                          driver.direction === 'risk_increasing' ? 'text-[#7A0C1E]' : 'text-emerald-700'
                        }`}
                      >
                        {driver.impactPoints > 0 ? `+${driver.impactPoints} pts` : `${driver.impactPoints} pts`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#5B6575]">Standard profile with balanced risk metrics.</div>
                )}
              </div>
            </div>

            {/* Profile Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-[#E3E7EE]">
                <span className="text-[#5B6575] text-[10px]">Contract Expiry</span>
                <div className="font-bold text-[#0B1F3A] mt-0.5">
                  {targetCustomer.monthsToContractEnd} months remaining
                </div>
                <span className="text-[10px] text-[#5B6575]">
                  Auto-Renew: {targetCustomer.autoRenew ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-[#E3E7EE]">
                <span className="text-[#5B6575] text-[10px]">Effective Charge</span>
                <div className="font-bold text-[#0B1F3A] mt-0.5">
                  £{targetCustomer.effectiveMonthlyCharge.toFixed(2)} / mo
                </div>
                <span className="text-[10px] text-[#5B6575]">
                  Discount: {targetCustomer.discountPercent}%
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-[#E3E7EE]">
                <span className="text-[#5B6575] text-[10px]">Data Usage</span>
                <div className="font-bold text-[#0B1F3A] mt-0.5">
                  {targetCustomer.avgUsageGB} GB / {targetCustomer.dataAllowanceGB} GB
                </div>
                <span className="text-[10px] text-[#7A0C1E]">
                  Overages: £{targetCustomer.overageCharges.toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-[#E3E7EE]">
                <span className="text-[#5B6575] text-[10px]">Complaints & Tickets</span>
                <div className="font-bold text-[#0B1F3A] mt-0.5">
                  {targetCustomer.complaints12M} Complaints
                </div>
                <span className="text-[10px] text-[#5B6575]">
                  {targetCustomer.supportTickets12M} total tickets
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-[#E3E7EE]">
                <span className="text-[#5B6575] text-[10px]">Customer CSAT</span>
                <div className="font-bold text-[#0B1F3A] mt-0.5">
                  {targetCustomer.satisfactionScore} / 10
                </div>
                <span className="text-[10px] text-[#5B6575]">
                  NPS: {targetCustomer.npsScore}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-[#E3E7EE]">
                <span className="text-[#5B6575] text-[10px]">12M Expected Loss</span>
                <div className="font-bold text-[#7A0C1E] mt-0.5">
                  £{(targetCustomer.expectedLoss12M || 0).toFixed(2)}
                </div>
                <span className="text-[10px] text-[#5B6575]">Annual exposure</span>
              </div>
            </div>

            {/* WHAT-IF RETENTION SIMULATOR */}
            <div className="bg-white rounded-xl border-2 border-[#C9A227]/40 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-[#C9A227]/20 text-[#8F7218]">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0B1F3A]">Interactive What-If Simulator</h4>
                    <p className="text-[11px] text-[#5B6575]">
                      Simulate retention levers and observe immediate model re-scoring and revenue saved.
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulation Result Comparison Box */}
              {whatIfResult && (
                <div className="p-3 bg-[#F4F7FB] rounded-lg border border-[#1D4C8F]/30 grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-[#5B6575] block">Baseline Prob</span>
                    <strong className="text-sm text-[#0B1F3A]">
                      {(whatIfResult.baselineProbability * 100).toFixed(1)}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 block font-semibold">Simulated Prob</span>
                    <strong className="text-sm text-emerald-700">
                      {(whatIfResult.simulatedProbability * 100).toFixed(1)}%
                    </strong>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      ({(whatIfResult.probabilityDelta * 100).toFixed(1)} pts)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#C9A227] block font-semibold">Annual Saved</span>
                    <strong className="text-sm text-[#8F7218]">
                      £{whatIfResult.annual12MSaved.toFixed(2)}
                    </strong>
                  </div>
                </div>
              )}

              {/* Levers Controls */}
              <div className="space-y-3 text-xs">
                {/* Lever 1: Discount */}
                <div>
                  <div className="flex justify-between font-medium text-[#1A2233] mb-1">
                    <span>Apply Retention Discount</span>
                    <span className="font-bold text-[#0B1F3A]">{whatIfLevers.discountPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="5"
                    value={whatIfLevers.discountPercent}
                    onChange={(e) =>
                      setWhatIfLevers({ ...whatIfLevers, discountPercent: Number(e.target.value) })
                    }
                    className="w-full accent-[#C9A227]"
                  />
                </div>

                {/* Lever 2: Extend Contract */}
                <div>
                  <div className="flex justify-between font-medium text-[#1A2233] mb-1">
                    <span>Extend Contract Horizon</span>
                    <span className="font-bold text-[#0B1F3A]">
                      +{whatIfLevers.extendContractMonths} months
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[0, 12, 24].map((m) => (
                      <button
                        key={m}
                        onClick={() => setWhatIfLevers({ ...whatIfLevers, extendContractMonths: m })}
                        className={`flex-1 py-1 rounded text-xs font-semibold border transition ${
                          whatIfLevers.extendContractMonths === m
                            ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                            : 'bg-white text-[#5B6575] border-[#E3E7EE] hover:bg-slate-50'
                        }`}
                      >
                        {m === 0 ? 'No extension' : `+${m} Months`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lever 3 & 4 Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2 rounded border border-[#E3E7EE] hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatIfLevers.resolveComplaints}
                      onChange={(e) =>
                        setWhatIfLevers({ ...whatIfLevers, resolveComplaints: e.target.checked })
                      }
                      className="text-[#C9A227] rounded-sm focus:ring-[#C9A227]"
                    />
                    <span className="text-[11px] font-medium text-[#1A2233]">Resolve Complaints</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded border border-[#E3E7EE] hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatIfLevers.upgradeDataAllowance}
                      onChange={(e) =>
                        setWhatIfLevers({ ...whatIfLevers, upgradeDataAllowance: e.target.checked })
                      }
                      className="text-[#C9A227] rounded-sm focus:ring-[#C9A227]"
                    />
                    <span className="text-[11px] font-medium text-[#1A2233]">Zero Overage Upgrade</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 bg-[#F5F6F8] border-t border-[#E3E7EE] flex items-center justify-between gap-3">
            <button
              onClick={() => onCreateCampaignForCustomer(targetCustomer)}
              className="w-full py-2 bg-[#0B1F3A] hover:bg-[#12305A] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <span>Build Targeted Campaign for {targetCustomer.id}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
