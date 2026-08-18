import React from 'react';
import {
  AlertOctagon,
  BarChart3,
  BookOpen,
  Calendar,
  CheckSquare,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  MessageSquareCode,
  Settings,
  Sparkles,
} from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  activeDebtCount: number;
  todayMissionsCount: number;
  pendingAssessmentsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  activeDebtCount,
  todayMissionsCount,
  pendingAssessmentsCount,
}) => {
  const tabs = [
    { id: 'dashboard' as AppTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'semester' as AppTab, label: 'Semester Plan', icon: Calendar },
    { id: 'courses' as AppTab, label: 'Courses & Topics', icon: BookOpen },
    {
      id: 'study' as AppTab,
      label: 'Study Missions',
      icon: CheckSquare,
      badge: todayMissionsCount > 0 ? todayMissionsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'assessments' as AppTab,
      label: 'Assessments',
      icon: FileSpreadsheet,
      badge: pendingAssessmentsCount > 0 ? pendingAssessmentsCount : undefined,
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    },
    {
      id: 'debt' as AppTab,
      label: 'Academic Debt',
      icon: AlertOctagon,
      badge: activeDebtCount > 0 ? activeDebtCount : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    { id: 'analytics' as AppTab, label: 'Analytics & Health', icon: BarChart3 },
    { id: 'coach' as AppTab, label: 'AI Coach', icon: Sparkles, highlight: true },
    { id: 'settings' as AppTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all select-none ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : tab.highlight
                    ? 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : tab.highlight ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full border ${
                      isActive ? 'bg-slate-800 text-amber-300 border-slate-700' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
