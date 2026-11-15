import { useMemo } from 'react';
import type { GameState } from '@/types';
import { levelFromXP, xpProgress, MODULES } from '@/lib/gameState';
import {
  Star,
  Zap,
  Shield,
  Trophy,
  CheckCircle2,
  Lock,
  CircleDot,
  PlayCircle,
} from 'lucide-react';

interface HUDProps {
  state: GameState;
  compact?: boolean;
}

export function HUD({ state, compact = false }: HUDProps) {
  const level = levelFromXP(state.totalXP);
  const prog = useMemo(() => xpProgress(state.totalXP), [state.totalXP]);

  const completedCount = state.modules.filter(
    (m) => m.status === 'completed'
  ).length;
  const earnedBadges = state.badges.filter((b) => b.earned).length;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-blue-300">
          <Zap className="w-4 h-4" />
          <span className="font-bold text-white">{state.totalXP}</span>
          <span className="text-slate-400">XP</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-300">
          <Shield className="w-4 h-4" />
          <span className="font-bold text-white">Lv.{level}</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-300">
          <Trophy className="w-4 h-4" />
          <span className="font-bold text-white">{earnedBadges}</span>
          <span className="text-slate-400">Badges</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-bold text-white">{completedCount}</span>
          <span>/ {MODULES.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
            {level}
          </div>
          <div>
            <div className="text-white font-bold text-lg">Level {level}</div>
            <div className="text-slate-400 text-sm">Astronaut Rank</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-blue-300 justify-end">
            <Zap className="w-5 h-5" />
            <span className="font-bold text-xl text-white">
              {state.totalXP}
            </span>
            <span className="text-slate-400 text-sm">XP</span>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>{prog.current} XP</span>
          <span>{prog.needed} XP to next level</span>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${prog.pct}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <div className="text-white font-bold text-lg">{completedCount}</div>
          <div className="text-slate-400 text-xs">Modules Done</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <div className="text-white font-bold text-lg">{earnedBadges}</div>
          <div className="text-slate-400 text-xs">Badges</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-white font-bold text-lg">
            {state.modules.reduce((s, m) => s + m.stars, 0)}
          </div>
          <div className="text-slate-400 text-xs">Stars</div>
        </div>
      </div>
    </div>
  );
}

export function ModuleStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'in-progress':
      return <PlayCircle className="w-5 h-5 text-blue-400" />;
    case 'available':
      return <CircleDot className="w-5 h-5 text-cyan-400" />;
    default:
      return <Lock className="w-5 h-5 text-slate-600" />;
  }
}

export function StarRating({ stars, size = 'md' }: { stars: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < stars
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-slate-600 fill-slate-700'
          }`}
        />
      ))}
    </div>
  );
}
