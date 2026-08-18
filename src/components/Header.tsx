import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Brain,
  CheckCircle2,
  ChevronRight,
  Flame,
  GraduationCap,
  RotateCcw,
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Watch':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'At Risk':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'High Pressure':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black text-xl">
              F
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">FirstClass OS</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-400/20">
                  v1.0 Core
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                {studentName} • {department.split('&')[0]}
              </p>
            </div>
          </div>

          {/* Quick Academic Vital Metrics */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Academic Health */}
            <div
              onClick={() => setCurrentTab('analytics')}
              className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
              title="Overall Academic Health Index (0-100)"
            >
              <GraduationCap className="w-4 h-4 text-sky-400" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Health</div>
                <div className="text-sm font-bold text-white leading-none mt-0.5">{academicHealth}<span className="text-slate-500 font-normal text-xs">/100</span></div>
              </div>
            </div>

            {/* Pressure Engine Indicator */}
            <div
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center space-x-2 border rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${getPressureBadgeColor(
                pressure.band
              )}`}
              title="Calculated Academic Pressure State"
            >
              <Flame className="w-4 h-4" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider font-bold leading-none opacity-80">Pressure</div>
                <div className="text-sm font-bold leading-none mt-0.5">
                  {pressure.score}<span className="text-xs font-normal opacity-70"> ({pressure.band})</span>
                </div>
              </div>
            </div>

            {/* Academic Debt Badge */}
            <div
              onClick={() => setCurrentTab('debt')}
              className={`flex items-center space-x-2 border rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${
                activeDebtCount > 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
              title="Active Academic Debt Items"
            >
              <AlertTriangle className="w-4 h-4" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider font-semibold leading-none opacity-80">Debt</div>
                <div className="text-sm font-bold leading-none mt-0.5">{activeDebtCount} {activeDebtCount === 1 ? 'Item' : 'Items'}</div>
              </div>
            </div>
          </div>

          {/* Right Action Icons & Notification Bell */}
          <div className="flex items-center space-x-2">
            {/* AI Coach Fast Trigger */}
            <button
              onClick={() => setCurrentTab('coach')}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Coach</span>
            </button>

            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 text-slate-900 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-sm">Accountability Alerts</span>
                      {unreadCount > 0 && (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-xs text-amber-300 hover:text-amber-200 underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">No notifications currently.</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            if (n.action_tab) {
                              setCurrentTab(n.action_tab as AppTab);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.is_read ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-semibold text-xs text-slate-900 flex items-center space-x-1.5">
                              {!n.is_read && <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />}
                              <span>{n.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                          {n.action_label && (
                            <div className="mt-2 flex items-center text-[11px] font-semibold text-amber-700 hover:text-amber-800">
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
          </div>
        </div>
      </div>
    </header>
  );
};
