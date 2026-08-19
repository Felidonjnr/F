import React from 'react';
import {
  AlertOctagon,
  Award,
  BookOpen,
  Calendar,
  CheckSquare,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  MessageSquareCode,
  Settings,
  Sparkles,
  Target,
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
  // Normalize current tab to one of the 4 destinations (or settings)
  const activeNormalizedTab =
    currentTab === 'dashboard' || currentTab === 'study'
      ? 'today'
      : currentTab === 'semester'
      ? 'courses'
      : currentTab === 'assessments' || currentTab === 'debt' || currentTab === 'analytics'
      ? 'review'
      : currentTab;

  const destinations = [
    {
      id: 'today' as AppTab,
      label: 'Today',
      sublabel: 'Command Center',
      icon: LayoutDashboard,
      badge: todayMissionsCount > 0 ? todayMissionsCount : undefined,
      badgeColor: 'bg-amber-400 text-slate-950',
    },
    {
      id: 'courses' as AppTab,
      label: 'Courses',
      sublabel: 'Map & Blueprint',
      icon: BookOpen,
    },
    {
      id: 'review' as AppTab,
      label: 'Review',
      sublabel: 'Evidence & Debt',
      icon: FileCheck2,
      badge: activeDebtCount > 0 ? activeDebtCount : pendingAssessmentsCount > 0 ? pendingAssessmentsCount : undefined,
      badgeColor: activeDebtCount > 0 ? 'bg-rose-500 text-white' : 'bg-sky-500 text-white',
    },
    {
      id: 'coach' as AppTab,
      label: 'Coach',
      sublabel: 'Socratic AI',
      icon: Sparkles,
      highlight: true,
    },
  ];

  return (
    <>
      {/* DESKTOP / TABLET TOP NAVIGATION BAR */}
      <nav id="desktop-main-nav" className="hidden sm:block bg-white border-b border-slate-200/90 sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            <div className="flex space-x-2">
              {destinations.map((dest) => {
                const Icon = dest.icon;
                const isActive = activeNormalizedTab === dest.id;

                return (
                  <button
                    key={dest.id}
                    id={`nav-dest-${dest.id}`}
                    onClick={() => setCurrentTab(dest.id)}
                    className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none ${
                      isActive
                        ? 'bg-slate-900 text-amber-300 shadow-xs'
                        : dest.highlight
                        ? 'text-amber-900 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-amber-400'
                          : dest.highlight
                          ? 'text-amber-600'
                          : 'text-slate-400'
                      }`}
                    />
                    <div className="text-left">
                      <div>{dest.label}</div>
                    </div>

                    {dest.badge !== undefined && (
                      <span
                        className={`text-[10px] font-black font-mono px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-slate-800 text-amber-300 border border-slate-700'
                            : dest.badgeColor
                        }`}
                      >
                        {dest.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
              <span>Deterministic Core v1.0</span>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION DOCK */}
      <nav
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-white shadow-2xl px-2 py-1.5"
      >
        <div className="grid grid-cols-4 gap-1">
          {destinations.map((dest) => {
            const Icon = dest.icon;
            const isActive = activeNormalizedTab === dest.id;

            return (
              <button
                key={dest.id}
                id={`mobile-nav-${dest.id}`}
                onClick={() => setCurrentTab(dest.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-amber-300 bg-slate-900 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {dest.badge !== undefined && (
                    <span
                      className={`absolute -top-1 -right-2 text-[9px] font-black font-mono w-4 h-4 rounded-full flex items-center justify-center ${dest.badgeColor}`}
                    >
                      {dest.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{dest.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
