import { useState } from 'react';
import {
  ClipboardCheck,
  Rocket,
  BookOpen,
  Cpu,
  Footprints,
  Plane,
  Siren,
  Trophy,
  Lock,
  CheckCircle2,
  CircleDot,
  PlayCircle,
  Star,
  Award,
  RotateCcw,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Starfield } from '@/components/Starfield';
import { HUD, ModuleStatusIcon, StarRating } from '@/components/HUD';
import { OutpostScreen } from '@/ui/OutpostScreen';
import { CrewPatch, CrewPhotoPicker } from '@/ui/CrewPhotoUI';
import { MODULES } from '@/lib/gameState';
import { completeModule, setInProgress } from '@/lib/progressEngine';
import type { GameState, ModuleId } from '@/types';
import type { useGameState } from '@/hooks/useGameState';

const ICON_MAP: Record<string, typeof Rocket> = {
  ClipboardCheck,
  Rocket,
  BookOpen,
  Cpu,
  Footprints,
  Plane,
  Siren,
};

interface DashboardProps {
  game: ReturnType<typeof useGameState>;
  activeModule: ModuleId | null;
  setActiveModule: (id: ModuleId | null) => void;
}

export function Dashboard({ game, activeModule, setActiveModule }: DashboardProps) {
  const { state, updateState, reset } = game;
  const [showBadges, setShowBadges] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(state.recruitName === 'Recruit');

  const handleComplete = (
    moduleId: ModuleId,
    score: number,
    stars: number,
    xp: number,
    extraData?: Record<string, unknown>
  ) => {
    updateState((prev) => {
      let newState = completeModule(prev, moduleId, score, stars, xp);
      if (extraData) {
        newState = { ...newState, ...extraData };
      }
      return newState;
    });
    setActiveModule(null);
  };

  const handleModuleClick = (moduleId: ModuleId) => {
    const module = state.modules.find((m) => m.moduleId === moduleId);
    if (!module || module.status === 'locked') return;
    updateState((prev) => setInProgress(prev, moduleId));
    setActiveModule(moduleId);
  };

  const completedCount = state.modules.filter((m) => m.status === 'completed').length;
  const allDone = completedCount === MODULES.length;
  const earnedBadges = state.badges.filter((b) => b.earned);

  if (showOnboarding) {
    return (
      <div className="min-h-screen relative bg-[#02030a] text-white flex items-center justify-center px-4">
        <Starfield density={200} />
        <div className="relative z-10 max-w-lg w-full">
          <div className="text-center mb-8 animate-[fadeIn_0.6s_ease]">
            <CrewPatch />
            <h1 className="text-4xl font-bold tracking-tight mb-2">Astro Cadet Academy</h1>
            <p className="text-slate-400">Gamified Astronaut Training Program</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 space-y-4 animate-[fadeIn_0.8s_ease]">
            <p className="text-slate-300 leading-relaxed">
              Welcome, recruit. You're about to begin your journey to becoming a certified astronaut. Through {MODULES.length} training modules, you'll learn everything from space science to emergency survival — and pilot a real lander simulation.
            </p>
            <div className="space-y-2">
              {[
                'Pass eligibility screening',
                'Get your mission assignment',
                'Master space knowledge & systems',
                'Train for spacewalks & launch',
                'Land the spacecraft yourself',
                'Handle in-flight emergencies',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>
            <div className="pt-2">
              <label className="block text-sm text-slate-400 mb-2">Enter your callsign:</label>
              <input
                type="text"
                placeholder="e.g. Nova, Orion, Falcon..."
                maxLength={20}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                onChange={(e) => {
                  const name = e.target.value.trim();
                  if (name) {
                    updateState((prev) => ({ ...prev, recruitName: name }));
                  }
                }}
              />
            </div>
            <CrewPhotoPicker />
            <button
              onClick={() => {
                setShowOnboarding(false);
                if (state.recruitName === 'Recruit') {
                  updateState((prev) => ({ ...prev, recruitName: 'Cadet' }));
                }
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Begin Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Outpost layout lives in src/ui. The original layout below is kept as a fallback.
  const USE_OUTPOST_LAYOUT = true;
  if (USE_OUTPOST_LAYOUT) {
    return (
      <OutpostScreen
        state={state}
        onStart={handleModuleClick}
        onReset={() => {
          reset();
          setShowOnboarding(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen relative bg-[#02030a] text-white">
      <Starfield density={120} />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Astro Cadet Academy</h1>
              <p className="text-slate-400 text-sm">Welcome, {state.recruitName}</p>
            </div>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-slate-500 hover:text-red-400 transition-colors"
            title="Reset progress"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* All completed celebration */}
        {allDone && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/20 via-yellow-400/10 to-amber-500/20 border border-amber-500/30 rounded-2xl p-6 text-center animate-[fadeIn_0.5s_ease]">
            <Award className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-1">Certified Astronaut!</h2>
            <p className="text-slate-300">You've completed all training modules. You are now ready for your mission, {state.recruitName}.</p>
          </div>
        )}

        {/* HUD + Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <HUD state={state} />
          </div>
          <button
            onClick={() => setShowBadges(!showBadges)}
            className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 text-left hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">Badges</h3>
              <span className="ml-auto text-sm text-slate-400">{earnedBadges.length}/{state.badges.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {state.badges.slice(0, 6).map((badge) => {
                const Icon = ICON_MAP[badge.icon] || Trophy;
                return (
                  <div
                    key={badge.id}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 p-1 ${
                      badge.earned
                        ? 'bg-amber-500/15 border border-amber-500/30'
                        : 'bg-slate-800/40 border border-slate-700/30'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${badge.earned ? 'text-amber-400' : 'text-slate-600'}`} />
                    <span className={`text-[8px] text-center leading-tight ${badge.earned ? 'text-amber-200' : 'text-slate-600'}`}>
                      {badge.name}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-slate-500 mt-2 text-right">
              {showBadges ? 'Hide all' : 'View all'} →
            </div>
          </button>
        </div>

        {/* Full badge grid */}
        {showBadges && (
          <div className="mb-8 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 animate-[fadeIn_0.3s_ease]">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {state.badges.map((badge) => {
                const Icon = ICON_MAP[badge.icon] || Trophy;
                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl p-3 flex flex-col items-center text-center gap-2 transition-all ${
                      badge.earned
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'bg-slate-800/30 border border-slate-700/30 opacity-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      badge.earned ? 'bg-amber-500/20' : 'bg-slate-800'
                    }`}>
                      {badge.earned ? (
                        <Icon className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${badge.earned ? 'text-amber-200' : 'text-slate-500'}`}>
                        {badge.name}
                      </div>
                      <div className={`text-[10px] mt-0.5 ${badge.earned ? 'text-slate-400' : 'text-slate-600'}`}>
                        {badge.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Training modules path */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white mb-1">Training Path</h2>
          <p className="text-slate-400 text-sm">Complete modules in order. Each unlocks the next.</p>
        </div>

        <div className="space-y-3">
          {MODULES.map((m, idx) => {
            const progress = state.modules.find((mp) => mp.moduleId === m.id);
            if (!progress) return null;
            const Icon = ICON_MAP[m.icon] || Rocket;
            const isLocked = progress.status === 'locked';
            const isCompleted = progress.status === 'completed';

            return (
              <div key={m.id}>
                {/* Connector line */}
                {idx > 0 && (
                  <div className={`ml-7 w-0.5 h-4 ${state.modules[idx - 1]?.status === 'completed' ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />
                )}
                <button
                  onClick={() => handleModuleClick(m.id)}
                  disabled={isLocked}
                  className={`w-full text-left rounded-2xl border p-4 transition-all group ${
                    isLocked
                      ? 'border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed'
                      : isCompleted
                        ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40'
                        : 'border-slate-700 bg-slate-900/60 hover:border-blue-500/40 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                      isLocked
                        ? 'bg-slate-800 text-slate-600'
                        : isCompleted
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-gradient-to-br from-blue-500/20 to-cyan-400/10 border border-blue-500/20 text-blue-400'
                    }`}>
                      <Icon className="w-7 h-7" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-slate-500 font-bold">MODULE {idx + 1}</span>
                        <ModuleStatusIcon status={progress.status} />
                      </div>
                      <h3 className={`font-bold ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                        {m.name}
                      </h3>
                      <p className="text-sm text-slate-400 truncate">{m.tagline}</p>
                    </div>

                    {/* Score / Stars */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isCompleted ? (
                        <>
                          <StarRating stars={progress.stars} size="sm" />
                          <span className="text-xs text-slate-400">{progress.score}%</span>
                        </>
                      ) : isLocked ? (
                        <Lock className="w-5 h-5 text-slate-600" />
                      ) : (
                        <div className="flex items-center gap-1 text-blue-400 text-sm font-bold">
                          <PlayCircle className="w-4 h-4" />
                          Start
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-600 text-xs">
          Astro Cadet Academy · NASA Space Apps Challenge
        </div>
      </div>

      {/* Reset confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Reset all progress?</h3>
            <p className="text-slate-400 text-sm">
              This will erase your XP, badges, and all module completions. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  reset();
                  setShowResetConfirm(false);
                  setShowOnboarding(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
