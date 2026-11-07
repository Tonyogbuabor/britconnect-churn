/**
 * BritConnect Customer Segmentation
 * Section 7.3: Rule-Based Value/Risk Cohorts & Unsupervised K-Means Clustering
 * Bubble charts, profile comparisons, and instant segment targeting.
 */

import React, { useState } from 'react';
import { CleanedCustomerRecord } from '../../types/telecom';
import {
  assignRuleBasedSegments,
  runKMeansClustering,
  SegmentProfile,
} from '../../services/segmentationEngine';
import {
  Users,
  PoundSterling,
  AlertTriangle,
  ArrowRight,
  Download,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import { exportCustomerListExcel } from '../../services/reportGenerator';

interface SegmentationViewProps {
  customers: CleanedCustomerRecord[];
  onNavigateToCustomers: (filterSegment: string) => void;
  onCreateCampaignFromSegment: (segment: SegmentProfile) => void;
}

export const SegmentationView: React.FC<SegmentationViewProps> = ({
  customers,
  onNavigateToCustomers,
  onCreateCampaignFromSegment,
}) => {
  const [lens, setLens] = useState<'rule_based' | 'kmeans'>('rule_based');
  const [kCount, setKCount] = useState(4);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Compute segments
  const { scoredRecords: ruleRecords, profiles: ruleProfiles } = assignRuleBasedSegments(customers);
  const { scoredRecords: kRecords, profiles: kProfiles } = runKMeansClustering(customers, kCount);

  const activeProfiles = lens === 'rule_based' ? ruleProfiles : kProfiles;
  const activeRecords = lens === 'rule_based' ? ruleRecords : kRecords;

  const currentSegment = activeProfiles.find((p) => p.id === selectedSegmentId) || activeProfiles[0];

  return (
    <div className="space-y-6">
      {/* Title & Lens Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0B1F3A] tracking-tight">
            Customer Segmentation & Behavioral Cohorts
          </h1>
          <p className="text-xs text-[#5B6575] mt-1">
            Section 7.3: Rule-based commercial risk cohorts and unsupervised K-Means clustering.
          </p>
        </div>

        {/* Lens Switcher */}
        <div className="flex items-center gap-2 bg-[#F5F6F8] p-1 rounded-xl border border-[#E3E7EE]">
          <button
            onClick={() => {
              setLens('rule_based');
              setSelectedSegmentId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              lens === 'rule_based'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-[#5B6575] hover:text-[#0B1F3A]'
            }`}
          >
            Lens A: Commercial Value & Risk
          </button>
          <button
            onClick={() => {
              setLens('kmeans');
              setSelectedSegmentId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              lens === 'kmeans'
                ? 'bg-[#0B1F3A] text-white shadow-xs'
                : 'text-[#5B6575] hover:text-[#0B1F3A]'
            }`}
          >
            Lens B: Unsupervised K-Means
          </button>
        </div>
      </div>

      {/* K-Means controls if active */}
      {lens === 'kmeans' && (
        <div className="bg-[#F4F7FB] border border-[#1D4C8F]/20 rounded-xl p-3.5 flex items-center justify-between text-xs text-[#12305A]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#C9A227]" />
            <span>Select Cluster Count (k = 3 to 6):</span>
            {[3, 4, 5, 6].map((k) => (
              <button
                key={k}
                onClick={() => setKCount(k)}
                className={`px-2.5 py-1 rounded-md font-bold transition ${
                  kCount === k
                    ? 'bg-[#0B1F3A] text-white'
                    : 'bg-white border border-[#E3E7EE] text-[#0B1F3A] hover:bg-slate-100'
                }`}
              >
                k={k}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[#5B6575]">
            Optimized via Euclidean distance over standardized usage, tenure, and satisfaction features.
          </span>
        </div>
      )}

      {/* 2D Value vs Risk Bubble Visualization */}
      <div className="bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-base text-[#0B1F3A]">
              Cohort Value vs Risk Positioning Map
            </h3>
            <p className="text-xs text-[#5B6575]">
              X-Axis: Average Churn Probability (%) · Y-Axis: Monthly Recurring Revenue (£) · Bubble Size: Customer Count
            </p>
          </div>
        </div>

        <div className="relative h-64 border-b border-l border-[#E3E7EE] my-4 p-4 flex items-center justify-center">
          {/* Quadrant dividing guidelines */}
          <div className="absolute left-1/2 top-0 bottom-0 border-r border-dashed border-[#E3E7EE]" />
          <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-[#E3E7EE]" />

          {/* Quadrant Labels */}
          <span className="absolute top-2 left-3 text-[10px] font-bold text-[#5B6575] uppercase tracking-wider">
            High Value · Low Risk (Protect)
          </span>
          <span className="absolute top-2 right-3 text-[10px] font-bold text-[#7A0C1E] uppercase tracking-wider">
            High Value · High Risk (Urgent Retention)
          </span>
          <span className="absolute bottom-2 left-3 text-[10px] font-bold text-[#1D4C8F] uppercase tracking-wider">
            Stable Base (Nurture)
          </span>
          <span className="absolute bottom-2 right-3 text-[10px] font-bold text-[#C9A227] uppercase tracking-wider">
            Low Value · High Risk (Automate)
          </span>

          {/* Render Segment Bubbles */}
          <div className="relative w-full h-full">
            {activeProfiles.map((p) => {
              // X: prob 0.05 to 0.85 -> 5% to 95%
              const xPct = Math.min(92, Math.max(8, p.averageChurnProbability * 110));
              // Y: MRR 0 to 80 -> 10% to 90%
              const yPct = Math.min(90, Math.max(10, (p.averageMonthlyCharge / 75) * 80));
              const size = Math.min(52, Math.max(26, Math.sqrt(p.customerCount) * 1.8));
              const isSelected = currentSegment?.id === p.id;
              const isHighRisk = p.averageChurnProbability >= 0.45;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedSegmentId(p.id)}
                  className={`absolute rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 drop-shadow-sm select-none ${
                    isSelected ? 'ring-3 ring-[#C9A227] ring-offset-2 scale-110 z-20' : 'hover:scale-105 z-10'
                  }`}
                  style={{
                    left: `${xPct}%`,
                    bottom: `${yPct}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: isHighRisk ? '#7A0C1E' : '#0B1F3A',
                    color: '#FFFFFF',
                  }}
                  title={`${p.name}: ${p.customerCount} customers, £${p.totalMRR} MRR, ${(p.averageChurnProbability * 100).toFixed(1)}% prob`}
                >
                  <span className="text-[10px] font-bold text-center leading-none px-1">
                    {p.customerCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cohorts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeProfiles.map((p) => {
          const isSelected = currentSegment?.id === p.id;
          const isHighRisk = p.averageChurnProbability >= 0.45;

          return (
            <div
              key={p.id}
              onClick={() => setSelectedSegmentId(p.id)}
              className={`bg-white rounded-xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-[#C9A227] ring-2 ring-[#C9A227]/20 shadow-md'
                  : 'border-[#E3E7EE] hover:border-[#1D4C8F]/40 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-[#0B1F3A]">{p.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isHighRisk ? 'bg-[#F6DDE1] text-[#7A0C1E]' : 'bg-[#DCE6F3] text-[#0B1F3A]'
                    }`}
                  >
                    {(p.averageChurnProbability * 100).toFixed(1)}% Risk
                  </span>
                </div>
                <p className="text-xs text-[#5B6575] mt-1 line-clamp-2">{p.description}</p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-[#F5F6F8] p-2.5 rounded-lg">
                  <div>
                    <span className="text-[10px] text-[#5B6575]">Subscribers</span>
                    <div className="font-bold text-[#0B1F3A]">
                      {p.customerCount.toLocaleString('en-GB')}{' '}
                      <span className="text-[10px] font-normal text-[#5B6575]">({p.percentageOfBase}%)</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5B6575]">Monthly Revenue</span>
                    <div className="font-bold text-[#0B1F3A]">£{p.totalMRR.toLocaleString('en-GB')}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A0C1E]">Rev At Risk</span>
                    <div className="font-bold text-[#7A0C1E]">£{p.revenueAtRiskGBP.toLocaleString('en-GB')}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5B6575]">Avg Tenure</span>
                    <div className="font-bold text-[#0B1F3A]">{p.averageTenureMonths}m</div>
                  </div>
                </div>

                {/* Defining Traits */}
                <div className="space-y-1 my-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6575]">
                    Defining Traits:
                  </span>
                  {p.definingTraits.map((trait, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-[#1A2233]">
                      <CheckCircle className="w-3 h-3 text-[#C9A227] shrink-0" />
                      <span>{trait}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#E3E7EE] mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToCustomers(p.name);
                  }}
                  className="text-xs font-semibold text-[#1D4C8F] hover:text-[#0B1F3A] flex items-center gap-1"
                >
                  <span>Filter Customers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateCampaignFromSegment(p);
                  }}
                  className="px-2.5 py-1 bg-[#0B1F3A] hover:bg-[#12305A] text-white text-[11px] font-semibold rounded-lg transition"
                >
                  Create Campaign
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
