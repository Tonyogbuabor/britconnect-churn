/**
 * BritConnect Top Bar Header
 */

import React, { useState } from 'react';
import { Search, Upload, AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface TopBarProps {
  lastUpdated: string;
  totalCustomers: number;
  isModelStale: boolean;
  onRetrainModel: () => void;
  onNavigate: (view: string) => void;
  onSearchCustomer: (id: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  lastUpdated,
  totalCustomers,
  isModelStale,
  onRetrainModel,
  onNavigate,
  onSearchCustomer,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchCustomer(searchInput.trim());
      onNavigate('scoring');
    }
  };

  return (
    <header className="h-16 bg-[#0B1F3A] border-b border-[#12305A] px-6 flex items-center justify-between sticky top-0 z-40 text-white shadow-xs">
      {/* Brand & Wordmark */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C9A227] to-[#8F7218] flex items-center justify-center font-serif font-black text-white text-lg shadow-sm border border-[#E5C566]/40">
            BC
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-lg tracking-tight text-white group-hover:text-[#E5C566] transition">
                BritConnect
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#C9A227]/20 text-[#E5C566] border border-[#C9A227]/30">
                AI Platform
              </span>
            </div>
            <p className="text-[10px] text-[#DCE6F3] hidden sm:block">
              UK Telecom Customer Churn Intelligence
            </p>
          </div>
        </div>

        {/* Dataset status */}
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-[#1D4C8F]/60 text-xs text-[#DCE6F3]">
          <Database className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>Last updated: {lastUpdated}</span>
          <span className="inline-block w-1 h-1 rounded-full bg-[#C9A227]" />
          <span className="font-semibold text-white">{totalCustomers.toLocaleString('en-GB')} customers</span>
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-3">
        {/* Global Customer Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Customer ID / City..."
            className="w-56 lg:w-72 pl-8 pr-3 py-1.5 text-xs bg-[#12305A] border border-[#1D4C8F] rounded-lg text-white placeholder-[#8F9CAE] focus:outline-hidden focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
          />
          <Search className="w-3.5 h-3.5 text-[#8F9CAE] absolute left-2.5 top-2.5" />
        </form>

        {/* Stale Model Alert */}
        {isModelStale && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#7A0C1E]/40 border border-[#A3152B] rounded-lg text-xs text-[#F6DDE1]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#E5C566]" />
            <span className="hidden sm:inline">Model trained on prior data</span>
            <button
              onClick={onRetrainModel}
              className="ml-1 px-2 py-0.5 bg-[#C9A227] hover:bg-[#8F7218] text-[#0B1F3A] font-bold rounded text-[10px] flex items-center gap-1 transition"
            >
              <RefreshCw className="w-2.5 h-2.5" /> Retrain
            </button>
          </div>
        )}

        {/* Quick Upload Button */}
        <button
          onClick={() => onNavigate('upload')}
          className="px-3 py-1.5 bg-[#C9A227] hover:bg-[#E5C566] text-[#0B1F3A] font-semibold text-xs rounded-lg flex items-center gap-1.5 transition shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Data</span>
        </button>
      </div>
    </header>
  );
};
