import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Flame,
  GraduationCap,
  LayoutDashboard,
  RotateCcw,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AppNotification, AppTab, PressureBreakdown } from '../types';

interface HeaderProps {
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;
  academicHealth: number;
  pressure: PressureBreakdown;
  activeDebtCount: number;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  studentName: string;
  department: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  academicHealth,
  pressure,
  activeDebtCount,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  studentName,
  department,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getPressureBadgeColor = (band: string) => {
    switch (band) {
      case 'Stable':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50';
      case 'Watch':
        return 'bg-sky-950/60 text-sky-300 border-sky-700/50';
      case 'At Risk':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/50';
      case 'High Pressure':
        return 'bg-orange-950/60 text-orange-300 border-orange-700/50';
      case 'Critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header id="app-main-header" className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800/90 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div
            id="brand-logo-btn"
            className="flex items-center space-x-3 cursor-pointer select-none group"
            onClick={() => setCurrentTab('today')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black text-lg transition-transform group-hover:scale-105">
              F
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  FirstClass OS
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md bg-slate-900 text-amber-300 border border-amber-400/30">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px] sm:max-w-xs">
                {studentName} • {department.split('&')[0]}
              </p>
            </div>
          </div>

          {/* Quick Academic Vital Metrics in Header */}
          <div className="hidden md:flex items-center space-x-2.5">
            {/* Academic Health Index */}
            <div
              id="header-health-metric"
              onClick={() => setCurrentTab('review')}
              className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl px-3 py-1.5 cursor-pointer transition-all hover:border-slate-700"
              title="Overall Academic Health Index (0-100)"
            >
              <GraduationCap className="w-4 h-4 text-sky-400" />
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none">
                  Health
                </div>
                <div className="text-xs font-mono font-bold text-white leading-none mt-1">
                  {academicHealth}
                  <span className="text-slate-500 font-normal text-[10px]">/100</span>
                </div>
              </div>
            </div>

            {/* Pressure Engine Indicator */}
            <div
              id="header-pressure-metric"
              onClick={() => setCurrentTab('today')}
              className={`flex items-center space-x-2 border rounded-xl px-3 py-1.5 cursor-pointer transition-all ${getPressureBadgeColor(
                pressure.band
              )}`}
              title="Deterministic Academic Pressure State"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider font-bold leading-none opacity-80">
                  Pressure
                </div>
                <div className="text-xs font-mono font-bold leading-none mt-1">
                  {pressure.score}
                  <span className="text-[10px] font-normal opacity-80"> ({pressure.band})</span>
                </div>
              </div>
            </div>

            {/* Academic Debt Badge */}
            <div
              id="header-debt-metric"
              onClick={() => setCurrentTab('review')}
              className={`flex items-center space-x-2 border rounded-xl px-3 py-1.5 cursor-pointer transition-all ${
                activeDebtCount > 0
                  ? 'bg-rose-950/60 border-rose-700/50 text-rose-300 hover:bg-rose-900/40'
                  : 'bg-emerald-950/60 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/40'
              }`}
              title="Active Academic Debt Deficit Items"
            >
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider font-bold leading-none opacity-80">
                  Debt
                </div>
                <div className="text-xs font-mono font-bold leading-none mt-1">
                  {activeDebtCount} {activeDebtCount === 1 ? 'Deficit' : 'Deficits'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Controls: AI Coach fast consult, Notifications bell, and Settings Gear */}
          <div className="flex items-center space-x-2">
            {/* AI Coach Fast Trigger */}
            <button
              id="header-coach-btn"
              onClick={() => setCurrentTab('coach')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 ${
                currentTab === 'coach'
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">AI Coach</span>
            </button>

            {/* Notification Dropdown */}
            <div className="relative">
              <button
                id="header-notifications-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 text-slate-900 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-xs uppercase tracking-wider">Accountability Alerts</span>
                      {unreadCount > 0 && (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-xs text-amber-300 hover:text-amber-200 underline font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">No active alerts currently.</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            if (n.action_tab) {
                              const tabTarget =
                                n.action_tab === 'dashboard' || n.action_tab === 'study'
                                  ? 'today'
                                  : n.action_tab === 'semester'
                                  ? 'courses'
                                  : n.action_tab === 'assessments' || n.action_tab === 'debt' || n.action_tab === 'analytics'
                                  ? 'review'
                                  : (n.action_tab as AppTab);
                              setCurrentTab(tabTarget);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.is_read ? 'bg-amber-50/60' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                              {!n.is_read && <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />}
                              <span>{n.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          {n.action_label && (
                            <div className="mt-1.5 flex items-center text-[11px] font-bold text-amber-700 hover:text-amber-800">
                              <span>{n.action_label}</span>
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Gear Icon in Header */}
            <button
              id="header-settings-btn"
              onClick={() => setCurrentTab('settings')}
              title="System Preferences & Profile"
              className={`p-2 rounded-xl transition-all ${
                currentTab === 'settings'
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
