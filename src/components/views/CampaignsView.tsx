/**
 * BritConnect Retention Campaigns Performance Hub
 * Section 7.4: Holdout A/B experiment design, incremental uplift z-test, ROI, and payback tracking.
 */

import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  TrendingUp,
  Percent,
  PoundSterling,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CampaignRecord, CleanedCustomerRecord } from '../../types/telecom';
import {
  createCampaignWithHoldout,
  updateCampaignOutcomes,
} from '../../services/campaignService';

interface CampaignsViewProps {
  campaigns: CampaignRecord[];
  allActiveCustomers: CleanedCustomerRecord[];
  onSaveCampaign: (campaign: CampaignRecord) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  allActiveCustomers,
  onSaveCampaign,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaignForResults, setSelectedCampaignForResults] = useState<CampaignRecord | null>(null);

  // Create Campaign Modal Form State
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [targetSegment, setTargetSegment] = useState('All');
  const [targetTier, setTargetTier] = useState('Critical & High');
  const [offerType, setOfferType] = useState<CampaignRecord['offerType']>('12-Month Contract Renewal Bonus');
  const [channel, setChannel] = useState<CampaignRecord['channel']>('Direct Phone Call');
  const [budgetGBP, setBudgetGBP] = useState(15000);
  const [costPerContact, setCostPerContact] = useState(12.5);
  const [offerCostPerAccept, setOfferCostPerAccept] = useState(25.0);
  const [owner, setOwner] = useState('Retention Team Alpha');
  const [holdoutPct, setHoldoutPct] = useState(15);

  // Results Entry Modal State
  const [resContacted, setResContacted] = useState(0);
  const [resResponded, setResResponded] = useState(0);
  const [resAccepted, setResAccepted] = useState(0);
  const [resTreatedSaves, setResTreatedSaves] = useState(0);
  const [resControlSaves, setResControlSaves] = useState(0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Filter target customers based on criteria
    const targeted = allActiveCustomers.filter((c) => {
      if (targetSegment !== 'All' && c.segment !== targetSegment) return false;
      if (targetTier === 'Critical & High' && !['Critical', 'High'].includes(c.riskTier || '')) return false;
      if (targetTier === 'Critical Only' && c.riskTier !== 'Critical') return false;
      return true;
    });

    const { campaign } = createCampaignWithHoldout(
      name,
      objective || 'Proactive contract renewal intervention to mitigate churn cliff.',
      offerType,
      channel,
      { segment: targetSegment, riskTier: targetTier },
      targeted.length > 0 ? targeted : allActiveCustomers.slice(0, 200),
      budgetGBP,
      costPerContact,
      offerCostPerAccept,
      owner,
      holdoutPct
    );

    onSaveCampaign(campaign);
    setShowCreateModal(false);
    // Reset
    setName('');
    setObjective('');
  };

  const handleOpenResults = (camp: CampaignRecord) => {
    setSelectedCampaignForResults(camp);
    const treatedTotal = Math.round(camp.customerCount * ((100 - camp.controlGroupPercentage) / 100));
    const controlTotal = camp.customerCount - treatedTotal;

    // Pre-populate with realistic estimates if empty
    setResContacted(treatedTotal);
    setResResponded(Math.round(treatedTotal * 0.45));
    setResAccepted(Math.round(treatedTotal * 0.32));
    setResTreatedSaves(Math.round(treatedTotal * 0.78));
    setResControlSaves(Math.round(controlTotal * 0.62));
  };

  const handleSaveResults = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignForResults) return;

    const updated = updateCampaignOutcomes(
      selectedCampaignForResults,
      resContacted,
      resResponded,
      resAccepted,
      resTreatedSaves,
      resControlSaves
    );

    onSaveCampaign(updated);
    setSelectedCampaignForResults(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0B1F3A] tracking-tight">
            Retention Campaign Performance Tracking
          </h1>
          <p className="text-xs text-[#5B6575] mt-1">
            Section 7.4: Controlled experimental design with holdouts, statistical uplift z-tests, ROI, and payback tracking.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-[#0B1F3A] hover:bg-[#12305A] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-[#C9A227]" />
          <span>Launch New Retention Campaign</span>
        </button>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E3E7EE] p-12 text-center shadow-xs">
            <Megaphone className="w-12 h-12 text-[#1D4C8F] mx-auto mb-3 opacity-40" />
            <h3 className="font-serif font-bold text-base text-[#0B1F3A]">
              No Active Retention Campaigns Yet
            </h3>
            <p className="text-xs text-[#5B6575] mt-1 max-w-md mx-auto">
              Design a targeted retention intervention with an automated stratified holdout control group to prove incremental save rates.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-[#C9A227] hover:bg-[#E5C566] text-[#0B1F3A] text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Campaign</span>
            </button>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs transition-all hover:border-[#1D4C8F]/30"
            >
              {/* Campaign Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E7EE] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0B1F3A] text-[#C9A227] flex items-center justify-center shrink-0">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#0B1F3A]">{camp.name}</h3>
                    <p className="text-xs text-[#5B6575]">
                      {camp.channel} · Offer: {camp.offerType} · Owner: {camp.owner}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      camp.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : camp.status === 'Active'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {camp.status}
                  </span>
                  <button
                    onClick={() => handleOpenResults(camp)}
                    className="px-3 py-1 bg-[#F5F6F8] hover:bg-[#E3E7EE] text-[#0B1F3A] text-xs font-semibold rounded-lg border border-[#E3E7EE] transition"
                  >
                    {camp.outcomesLoaded ? 'Update Outcomes' : 'Record Results'}
                  </button>
                </div>
              </div>

              {/* Campaign Metrics Overview */}
              {camp.outcomesLoaded ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 text-xs">
                  <div className="p-3 bg-[#F5F6F8] rounded-lg">
                    <span className="text-[10px] text-[#5B6575] block">Target Cohort</span>
                    <strong className="text-base text-[#0B1F3A]">
                      {camp.customerCount.toLocaleString('en-GB')}
                    </strong>
                    <span className="text-[10px] text-[#5B6575] block">
                      Holdout: {camp.controlGroupPercentage}%
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-semibold block">
                      Incremental Uplift
                    </span>
                    <strong className="text-base text-emerald-800">
                      +{camp.upliftPercentagePoints}%
                    </strong>
                    <span className="text-[10px] text-emerald-700 block">
                      p-value: {camp.upliftPValue} ({camp.upliftPValue < 0.05 ? 'Significant' : 'Directional'})
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F6F8] rounded-lg">
                    <span className="text-[10px] text-[#5B6575] block">Treated Retention</span>
                    <strong className="text-base text-[#0B1F3A]">{camp.treatedRetentionRate}%</strong>
                    <span className="text-[10px] text-[#5B6575] block">
                      Control: {camp.controlRetentionRate}%
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F6F8] rounded-lg">
                    <span className="text-[10px] text-[#5B6575] block">Retained Revenue (12M)</span>
                    <strong className="text-base text-[#0B1F3A]">
                      £{camp.retainedRevenueGBP.toLocaleString('en-GB')}
                    </strong>
                    <span className="text-[10px] text-[#5B6575] block">
                      Total Cost: £{camp.totalCostGBP.toLocaleString('en-GB')}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-[10px] text-amber-800 font-semibold block">Campaign ROI</span>
                    <strong className="text-base text-amber-800">{camp.netROI}×</strong>
                    <span className="text-[10px] text-amber-700 block">
                      Cost/Save: £{camp.costPerSaveGBP.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F6F8] rounded-lg">
                    <span className="text-[10px] text-[#5B6575] block">Payback Window</span>
                    <strong className="text-base text-[#0B1F3A]">
                      {camp.paybackPeriodMonths} Months
                    </strong>
                    <span className="text-[10px] text-emerald-700 block font-semibold">
                      95% CI: [{camp.upliftConfInterval95[0]}%, {camp.upliftConfInterval95[1]}%]
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-slate-50 border border-dashed border-[#E3E7EE] rounded-lg text-xs text-[#5B6575] flex items-center justify-between">
                  <div>
                    <strong>No outcome data recorded yet:</strong> Campaign currently in progress. Target cohort assigned with {camp.controlGroupPercentage}% stratified holdout.
                  </div>
                  <button
                    onClick={() => handleOpenResults(camp)}
                    className="px-3 py-1 bg-[#0B1F3A] text-white text-xs font-semibold rounded-lg hover:bg-[#12305A] transition shrink-0 ml-3"
                  >
                    Enter Campaign Results
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-[#E3E7EE] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-[#E3E7EE] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#0B1F3A]">
                Configure Targeted Retention Campaign
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#5B6575] hover:text-[#0B1F3A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#0B1F3A] block mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q4 Fibre Contract Cliff Renewal Push"
                  className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg focus:outline-hidden focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0B1F3A] block mb-1">Target Subscriber Tier</label>
                <select
                  value={targetTier}
                  onChange={(e) => setTargetTier(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg"
                >
                  <option value="Critical & High">Critical & High Risk Cohorts (Prob &gt;= 50%)</option>
                  <option value="Critical Only">Critical Risk Only (Prob &gt;= 70%)</option>
                  <option value="All">All Active Subscribers</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#0B1F3A] block mb-1">Offer / Intervention</label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg"
                  >
                    <option value="12-Month Contract Renewal Bonus">12M Renewal Bonus</option>
                    <option value="Loyalty Discount">15% Loyalty Discount</option>
                    <option value="Free Speed/Data Upgrade">Free Speed / Data Boost</option>
                    <option value="Proactive VIP Service Call">Proactive VIP Service Call</option>
                    <option value="Bill Credit Goodwill">£25 Bill Credit Goodwill</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#0B1F3A] block mb-1">Primary Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg"
                  >
                    <option value="Direct Phone Call">Direct Phone Call</option>
                    <option value="Personalised Email">Personalised Email</option>
                    <option value="Priority SMS">Priority SMS</option>
                    <option value="In-App Banner & Notification">In-App Banner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#0B1F3A] block mb-1">Holdout Group (%)</label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={holdoutPct}
                    onChange={(e) => setHoldoutPct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#0B1F3A] block mb-1">Cost/Contact (£)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={costPerContact}
                    onChange={(e) => setCostPerContact(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#0B1F3A] block mb-1">Offer Cost (£)</label>
                  <input
                    type="number"
                    step="1"
                    value={offerCostPerAccept}
                    onChange={(e) => setOfferCostPerAccept(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E3E7EE] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E3E7EE] rounded-lg text-[#5B6575] hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B1F3A] hover:bg-[#12305A] text-white font-bold rounded-lg shadow-xs"
                >
                  Confirm & Stratify Holdout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD RESULTS MODAL */}
      {selectedCampaignForResults && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-[#E3E7EE]">
            <div className="flex items-center justify-between mb-4 border-b border-[#E3E7EE] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#0B1F3A]">
                Record Outcomes: {selectedCampaignForResults.name}
              </h3>
              <button onClick={() => setSelectedCampaignForResults(null)} className="text-[#5B6575] hover:text-[#0B1F3A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResults} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#0B1F3A] block mb-1">Subscribers Contacted</label>
                <input
                  type="number"
                  value={resContacted}
                  onChange={(e) => setResContacted(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#0B1F3A] block mb-1">Responded</label>
                  <input
                    type="number"
                    value={resResponded}
                    onChange={(e) => setResResponded(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#0B1F3A] block mb-1">Accepted Offer</label>
                  <input
                    type="number"
                    value={resAccepted}
                    onChange={(e) => setResAccepted(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E3E7EE]">
                <div>
                  <label className="font-semibold text-emerald-800 block mb-1">Treated Saves</label>
                  <input
                    type="number"
                    value={resTreatedSaves}
                    onChange={(e) => setResTreatedSaves(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-emerald-50/50"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#5B6575] block mb-1">Holdout Control Saves</label>
                  <input
                    type="number"
                    value={resControlSaves}
                    onChange={(e) => setResControlSaves(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E3E7EE] rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E3E7EE] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCampaignForResults(null)}
                  className="px-4 py-2 border border-[#E3E7EE] rounded-lg text-[#5B6575] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C9A227] hover:bg-[#E5C566] text-[#0B1F3A] font-bold rounded-lg shadow-xs"
                >
                  Compute Uplift & ROI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
