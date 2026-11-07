/**
 * BritConnect Primary Navigation Sidebar
 * Navy palette (#0B1F3A), Gold indicator (#C9A227)
 */

import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  CheckCircle2,
  TrendingDown,
  PieChart,
  UserCheck,
  Megaphone,
  Sparkles,
  Bot,
  Cpu,
  FileText,
  HardDrive,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  hasData: boolean;
  hasTrainedModel: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  hasData,
  hasTrainedModel,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, requiresData: true },
    { id: 'upload', label: 'Upload Centre', icon: UploadCloud, requiresData: false },
    { id: 'quality', label: 'Data Quality & Cleaning', icon: CheckCircle2, requiresData: true },
    { id: 'drivers', label: 'Churn Drivers & Diagnostics', icon: TrendingDown, requiresData: true },
    { id: 'segmentation', label: 'Customer Segmentation', icon: PieChart, requiresData: true },
    { id: 'scoring', label: 'Customer Scoring & 360', icon: UserCheck, requiresModel: true },
    { id: 'campaigns', label: 'Retention Campaigns', icon: Megaphone, requiresData: true },
    { id: 'action_centre', label: 'Retention Action Centre', icon: Sparkles, requiresData: true },
    { id: 'ai_assistant', label: 'AI Analytics Assistant', icon: Bot, requiresData: false },
    { id: 'models', label: 'Model Studio & Evaluation', icon: Cpu, requiresData: true },
    { id: 'reports', label: 'Reports & Exports', icon: FileText, requiresData: true },
    { id: 'data_management', label: 'Data Management', icon: HardDrive, requiresData: false },
    { id: 'settings', label: 'Settings & Diagnostics', icon: Settings, requiresData: false },
  ];

  return (
    <aside className="w-64 bg-[#0B1F3A] border-r border-[#12305A] flex flex-col shrink-0 text-[#DCE6F3] select-none min-h-[calc(100vh-4rem)]">
      {/* Platform Section Title */}
      <div className="px-5 pt-4 pb-2 text-[10px] uppercase font-bold tracking-wider text-[#8F9CAE]">
        Retention Intelligence
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isDisabled = (item.requiresData && !hasData) || (item.requiresModel && !hasTrainedModel);

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onNavigate(item.id)}
              disabled={isDisabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition text-left relative ${
                isActive
                  ? 'bg-[#12305A] text-white font-semibold shadow-xs'
                  : isDisabled
                  ? 'text-[#5B6575] opacity-50 cursor-not-allowed'
                  : 'text-[#DCE6F3] hover:bg-[#12305A]/60 hover:text-white'
              }`}
            >
              {/* Gold Active State Bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#C9A227] rounded-r-md" />
              )}
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[#C9A227]' : isDisabled ? 'text-[#5B6575]' : 'text-[#8F9CAE]'
                }`}
              />
              <span className="truncate">{item.label}</span>

              {item.id === 'action_centre' && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#C9A227]/20 text-[#E5C566] border border-[#C9A227]/30">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="p-4 border-t border-[#12305A] text-[11px] text-[#8F9CAE]">
        <div className="flex items-center justify-between">
          <span>BritConnect v2.4</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" title="System operational" />
        </div>
        <p className="text-[10px] text-[#5B6575] mt-1">
          Privacy-First · In-Browser ML
        </p>
      </div>
    </aside>
  );
};
