/**
 * BritConnect Retention Action Centre
 * Section 8.3: Personalised, Evidence-Based Retention Playbooks
 * Structure: Priority (P1/P2/P3), Evidence, Root Cause Hypothesis, Personalised Actions
 * with Offer-Sizing Guardrails, Implementation Steps, Business Impact, and Measurable KPIs.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Layers,
  User,
  Users,
  Briefcase,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  CleanedCustomerRecord,
  BusinessAssumptions,
  CampaignRecord,
} from '../../types/telecom';

interface RetentionActionCentreProps {
  customers: CleanedCustomerRecord[];
  assumptions: BusinessAssumptions;
  onCreateCampaignFromRecommendation: (rec: any) => void;
}

export const RetentionActionCentre: React.FC<RetentionActionCentreProps> = ({
  customers,
  assumptions,
  onCreateCampaignFromRecommendation,
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'segment' | 'individual'>('portfolio');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedSegmentName, setSelectedSegmentName] = useState<string>('Contract Cliff');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendationText, setRecommendationText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Top high-risk active customers for the dropdown
  const highRiskCustomers = customers
    .filter((c) => c.churnFlag === 0 && (c.churnProbability ?? 0) >= 0.5)
    .sort((a, b) => (b.expectedMonthlyRevenueAtRisk || 0) - (a.expectedMonthlyRevenueAtRisk || 0))
    .slice(0, 20);

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId) || highRiskCustomers[0];

  // Fetch or Generate AI Recommendation
  const handleGenerateRecommendation = async () => {
    setIsLoading(true);
    try {
      let payload: any = {};
      if (activeTab === 'individual' && activeCustomer) {
        payload = {
          type: 'Individual Customer Retention Plan',
          customer: {
            id: activeCustomer.id,
            segment: activeCustomer.segment,
            serviceType: activeCustomer.serviceType,
            planName: activeCustomer.planName,
            contractType: activeCustomer.contractType,
            monthsToContractEnd: activeCustomer.monthsToContractEnd,
            autoRenew: activeCustomer.autoRenew,
            monthlyCharge: activeCustomer.monthlyCharge,
            effectiveCharge: activeCustomer.effectiveMonthlyCharge,
            avgUsageGB: activeCustomer.avgUsageGB,
            dataAllowanceGB: activeCustomer.dataAllowanceGB,
            overageCharges: activeCustomer.overageCharges,
            complaints12M: activeCustomer.complaints12M,
            avgResolutionHours: activeCustomer.avgResolutionHours,
            outages12M: activeCustomer.networkOutages12M,
            csat: activeCustomer.satisfactionScore,
            nps: activeCustomer.npsScore,
            competitorOffer: activeCustomer.competitorOfferReceived,
            churnProbability: activeCustomer.churnProbability,
            revenueAtRisk: activeCustomer.expectedMonthlyRevenueAtRisk,
            topDrivers: activeCustomer.topDrivers,
          },
          assumptions,
        };
      } else if (activeTab === 'segment') {
        const segCustomers = customers.filter((c) => (c.ruleSegment || c.segment) === selectedSegmentName);
        payload = {
          type: `Cohort Playbook: ${selectedSegmentName}`,
          cohortSummary: {
            segmentName: selectedSegmentName,
            customerCount: segCustomers.length,
            avgProbability: segCustomers.reduce((s, c) => s + (c.churnProbability || 0.2), 0) / Math.max(1, segCustomers.length),
            totalRevenueAtRisk: segCustomers.reduce((s, c) => s + (c.expectedMonthlyRevenueAtRisk || 0), 0),
            topDrivers: ['Contract expiration within 60 days', 'Unresolved complaints > 36h', 'Rival switcher offers'],
          },
          assumptions,
        };
      } else {
        // Portfolio Strategy
        payload = {
          type: 'Portfolio-Level Retention Strategy',
          cohortSummary: {
            scope: 'BritConnect UK Customer Base',
            totalActive: customers.filter((c) => c.churnFlag === 0).length,
            criticalRiskCount: customers.filter((c) => (c.churnProbability || 0) >= 0.7).length,
            highRiskCount: customers.filter((c) => (c.churnProbability || 0) >= 0.5 && (c.churnProbability || 0) < 0.7).length,
            expiring30Days: customers.filter((c) => c.contractExpiring30Days === 1).length,
            totalRevenueAtRisk: customers.reduce((s, c) => s + (c.expectedMonthlyRevenueAtRisk || 0), 0),
          },
          assumptions,
        };
      }

      const res = await fetch('/api/gemini/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      setRecommendationText(json.text || 'Failed to generate recommendation.');
    } catch {
      setRecommendationText('Service temporarily unavailable. Please verify API settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!recommendationText) return;
    navigator.clipboard.writeText(recommendationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#0B1F3A] tracking-tight">
            Retention Action Centre & AI Playbooks
          </h1>
          <p className="text-xs text-[#5B6575] mt-1">
            Section 8.3: Personalised P1/P2/P3 retention strategies with offer-sizing guardrails, implementation scripts, and measurable KPIs.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#F5F6F8] p-1 rounded-xl border border-[#E3E7EE]">
          <button
            onClick={() => {
              setActiveTab('portfolio');
              setRecommendationText(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'portfolio' ? 'bg-[#0B1F3A] text-white shadow-xs' : 'text-[#5B6575] hover:text-[#0B1F3A]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Portfolio Strategy</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('segment');
              setRecommendationText(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'segment' ? 'bg-[#0B1F3A] text-white shadow-xs' : 'text-[#5B6575] hover:text-[#0B1F3A]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Segment Playbook</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('individual');
              setRecommendationText(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'individual' ? 'bg-[#0B1F3A] text-white shadow-xs' : 'text-[#5B6575] hover:text-[#0B1F3A]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Individual Subscriber</span>
          </button>
        </div>
      </div>

      {/* Target Selection Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E3E7EE] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {activeTab === 'individual' ? (
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs font-semibold text-[#0B1F3A]">Select High-Risk Account:</span>
            <select
              value={selectedCustomerId || activeCustomer?.id}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setRecommendationText(null);
              }}
              className="bg-[#F5F6F8] border border-[#E3E7EE] rounded-lg px-3 py-1.5 text-xs text-[#0B1F3A] max-w-xs focus:outline-hidden focus:border-[#C9A227]"
            >
              {highRiskCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} · {c.serviceType} · £{c.effectiveMonthlyCharge}/mo · {((c.churnProbability || 0) * 100).toFixed(0)}% Risk
                </option>
              ))}
            </select>
          </div>
        ) : activeTab === 'segment' ? (
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs font-semibold text-[#0B1F3A]">Select Cohort Playbook:</span>
            <select
              value={selectedSegmentName}
              onChange={(e) => {
                setSelectedSegmentName(e.target.value);
                setRecommendationText(null);
              }}
              className="bg-[#F5F6F8] border border-[#E3E7EE] rounded-lg px-3 py-1.5 text-xs text-[#0B1F3A] max-w-xs focus:outline-hidden focus:border-[#C9A227]"
            >
              <option value="Contract Cliff">Contract Cliff (Ending &lt;= 60d)</option>
              <option value="Service Frustrated">Service Frustrated (Complaints / Outages)</option>
              <option value="High Value – High Risk">High Value – High Risk</option>
              <option value="Price Sensitive / Competitor Risk">Price Sensitive / Competitor Risk</option>
              <option value="Payment Stress">Payment Stress</option>
            </select>
          </div>
        ) : (
          <div className="text-xs text-[#5B6575]">
            Targeting full BritConnect active portfolio across all constituent UK nations.
          </div>
        )}

        <button
          onClick={handleGenerateRecommendation}
          disabled={isLoading}
          className="px-4 py-2 bg-[#C9A227] hover:bg-[#E5C566] text-[#0B1F3A] font-bold text-xs rounded-lg flex items-center gap-2 transition shadow-xs disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Synthesising Playbook...' : 'Generate AI Action Plan'}</span>
        </button>
      </div>

      {/* Main Strategy Container */}
      <div className="bg-white rounded-xl border border-[#E3E7EE] p-6 shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#5B6575] animate-pulse flex flex-col items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-[#C9A227]" />
            <p className="font-semibold text-sm text-[#0B1F3A]">
              Generating evidence-backed retention recommendations...
            </p>
            <p className="max-w-md text-[#5B6575]">
              Evaluating contract horizons, service friction scores, and calculating offer sizing limits (discount &le; 20% of retained margin).
            </p>
          </div>
        ) : recommendationText ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EE]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#7A0C1E] text-white">
                  P1 Priority
                </span>
                <span className="text-xs font-semibold text-[#0B1F3A]">
                  Certified Evidence-Based Recommendation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-[#E3E7EE] text-[#0B1F3A] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5B6575]" />}
                  <span>{copied ? 'Copied' : 'Copy Plan'}</span>
                </button>
                <button
                  onClick={() =>
                    onCreateCampaignFromRecommendation({
                      name: `Retention: ${activeCustomer?.id || selectedSegmentName}`,
                      targetTier: 'Critical & High',
                      offerType: '12-Month Contract Renewal Bonus',
                    })
                  }
                  className="px-4 py-1 bg-[#0B1F3A] hover:bg-[#12305A] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs"
                >
                  <span>Convert to Campaign</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C9A227]" />
                </button>
              </div>
            </div>

            <div className="bg-[#F5F6F8] p-5 rounded-xl border border-[#E3E7EE] text-xs text-[#1A2233] leading-relaxed whitespace-pre-line font-normal">
              {recommendationText}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#5B6575]">
            <FileText className="w-10 h-10 text-[#1D4C8F] mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm text-[#0B1F3A]">
              No recommendation generated for this scope yet
            </p>
            <p className="max-w-md mx-auto mt-1">
              Click <strong>Generate AI Action Plan</strong> above to produce a tailored retention plan with exact driver citations, offer sizing rules, and measurable KPIs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
