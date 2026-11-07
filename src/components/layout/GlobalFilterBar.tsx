/**
 * BritConnect Global Filter Bar
 * Persists across all analytics and reporting views
 */

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { GlobalFilterState } from '../../types/telecom';

interface GlobalFilterBarProps {
  filters: GlobalFilterState;
  onFilterChange: (newFilters: Partial<GlobalFilterState>) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  availableOptions: {
    segments: string[];
    serviceTypes: string[];
    nations: string[];
    contractTypes: string[];
    riskTiers: string[];
  };
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  availableOptions,
}) => {
  const hasActiveFilters =
    filters.segment ||
    filters.serviceType ||
    filters.nation ||
    filters.contractType ||
    filters.riskTier;

  return (
    <div className="bg-white border-b border-[#E3E7EE] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-[#0B1F3A] mr-1">
          <Filter className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>Filters:</span>
        </div>

        {/* Customer Segment */}
        <select
          value={filters.segment}
          onChange={(e) => onFilterChange({ segment: e.target.value })}
          className="bg-[#F5F6F8] border border-[#E3E7EE] rounded-md px-2.5 py-1 text-xs text-[#1A2233] focus:outline-hidden focus:border-[#C9A227]"
        >
          <option value="">All Segments</option>
          {availableOptions.segments.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Service Type */}
        <select
          value={filters.serviceType}
          onChange={(e) => onFilterChange({ serviceType: e.target.value })}
          className="bg-[#F5F6F8] border border-[#E3E7EE] rounded-md px-2.5 py-1 text-xs text-[#1A2233] focus:outline-hidden focus:border-[#C9A227]"
        >
          <option value="">All Services</option>
          {availableOptions.serviceTypes.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* UK Nation */}
        <select
          value={filters.nation}
          onChange={(e) => onFilterChange({ nation: e.target.value })}
          className="bg-[#F5F6F8] border border-[#E3E7EE] rounded-md px-2.5 py-1 text-xs text-[#1A2233] focus:outline-hidden focus:border-[#C9A227]"
        >
          <option value="">All UK Nations</option>
          {availableOptions.nations.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        {/* Contract Type */}
        <select
          value={filters.contractType}
          onChange={(e) => onFilterChange({ contractType: e.target.value })}
          className="bg-[#F5F6F8] border border-[#E3E7EE] rounded-md px-2.5 py-1 text-xs text-[#1A2233] focus:outline-hidden focus:border-[#C9A227]"
        >
          <option value="">All Contract Terms</option>
          {availableOptions.contractTypes.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>

        {/* Risk Tier */}
        <select
          value={filters.riskTier}
          onChange={(e) => onFilterChange({ riskTier: e.target.value })}
          className="bg-[#F5F6F8] border border-[#E3E7EE] rounded-md px-2.5 py-1 text-xs text-[#1A2233] focus:outline-hidden focus:border-[#C9A227]"
        >
          <option value="">All Risk Tiers</option>
          {availableOptions.riskTiers.map((t) => (
            <option key={t} value={t}>
              {t} Risk
            </option>
          ))}
        </select>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[#7A0C1E] hover:text-[#4D0612] font-medium px-2 py-1 rounded-md hover:bg-[#F6DDE1]/50 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Scope count indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#5B6575]">
          Active Scope: <strong className="text-[#0B1F3A]">{filteredCount.toLocaleString('en-GB')}</strong> of {totalCount.toLocaleString('en-GB')} customers
        </span>
        {filteredCount < totalCount && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#C9A227]/20 text-[#8F7218]">
            Filtered ({( (filteredCount / Math.max(1, totalCount)) * 100 ).toFixed(0)}%)
          </span>
        )}
      </div>
    </div>
  );
};
