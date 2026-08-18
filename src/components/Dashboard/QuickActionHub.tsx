import React from 'react';
import {
  AlertOctagon,
  BookPlus,
  Brain,
  CheckCircle2,
  FileCheck2,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AppTab } from '../../types';

interface QuickActionHubProps {
  onNavigate: (tab: AppTab) => void;
  onOpenNewAssessment: () => void;
  onOpenUploadMaterial: () => void;
  onRegenerateMissions: () => void;
  onLaunchFirstPendingMission: () => void;
}

export const QuickActionHub: React.FC<QuickActionHubProps> = ({
  onNavigate,
  onOpenNewAssessment,
  onOpenUploadMaterial,
  onRegenerateMissions,
  onLaunchFirstPendingMission,
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-bold text-amber-400">Command Center</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-0.5">Quick Academic Execution Hub</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRegenerateMissions}
            className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            title="Recalculate daily study missions from current debts and capacity"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recalculate Missions</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {/* Action 1: Launch Study */}
        <button
          onClick={onLaunchFirstPendingMission}
          className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-left transition-all group flex flex-col justify-between"
        >
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
            <Play className="w-4 h-4 fill-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              Start Study Mission
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Launch interactive active recall mode</div>
          </div>
        </button>

        {/* Action 2: Generate Assessment */}
        <button
          onClick={onOpenNewAssessment}
          className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-400/50 text-left transition-all group flex flex-col justify-between"
        >
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 w-fit">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
              New Assessment
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Take timed quiz or weekly mock</div>
          </div>
        </button>

        {/* Action 3: Upload Material & Map Syllabus */}
        <button
          onClick={onOpenUploadMaterial}
          className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-400/50 text-left transition-all group flex flex-col justify-between"
        >
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 w-fit">
            <BookPlus className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
              Upload Material
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Extract syllabus & index notes</div>
          </div>
        </button>

        {/* Action 4: Ask AI Coach */}
        <button
          onClick={() => onNavigate('coach')}
          className="p-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400 text-left transition-all group flex flex-col justify-between"
        >
          <div className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold w-fit">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200 transition-colors">
              Consult AI Coach
            </div>
            <div className="text-[11px] text-amber-200/70 mt-0.5">Context-aware academic guidance</div>
          </div>
        </button>
      </div>
    </div>
  );
};
