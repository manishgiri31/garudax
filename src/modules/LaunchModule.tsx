import { useState, useEffect } from 'react';
import { Rocket, CheckCircle2, Circle, AlertTriangle, Timer, Zap } from 'lucide-react';
import { ModuleShell, ResultScreen } from '@/components/ModuleShell';
import type { GameState } from '@/types';

interface LaunchModuleProps {
  state: GameState;
  onComplete: (score: number, stars: number, xp: number) => void;
  onExit: () => void;
}

interface CheckItem {
  id: string;
  label: string;
  category: string;
  done: boolean;
  critical: boolean;
}

const INITIAL_CHECKLIST: CheckItem[] = [
  { id: 'c1', label: 'Confirm suit integrity and helmet seal', category: 'Suit', done: false, critical: true },
  { id: 'c2', label: 'Verify oxygen supply at 100%', category: 'Suit', done: false, critical: true },
  { id: 'c3', label: 'Check communications with mission control', category: 'Comms', done: false, critical: true },
  { id: 'c4', label: 'Test backup radio frequency', category: 'Comms', done: false, critical: false },
  { id: 'c5', label: 'Confirm fuel levels: primary tanks full', category: 'Fuel', done: false, critical: true },
  { id: 'c6', label: 'Verify fuel lines pressurized', category: 'Fuel', done: false, critical: true },
  { id: 'c7', label: 'Check engine ignition sequence ready', category: 'Engines', done: false, critical: true },
  { id: 'c8', label: 'Verify nozzle clear of debris', category: 'Engines', done: false, critical: false },
  { id: 'c9', label: 'Confirm guidance computer online', category: 'Navigation', done: false, critical: true },
  { id: 'c10', label: 'Calibrate gyroscopes', category: 'Navigation', done: false, critical: false },
  { id: 'c11', label: 'Secure all loose items in cabin', category: 'Cabin', done: false, critical: false },
  { id: 'c12', label: 'Fasten safety harnesses', category: 'Cabin', done: false, critical: true },
  { id: 'c13', label: 'Confirm launch pad clear', category: 'External', done: false, critical: true },
  { id: 'c14', label: 'Verify weather conditions nominal', category: 'External', done: false, critical: false },
  { id: 'c15', label: 'Arm launch abort system', category: 'Safety', done: false, critical: true },
];

const CATEGORIES = ['Suit', 'Comms', 'Fuel', 'Engines', 'Navigation', 'Cabin', 'External', 'Safety'];

export function LaunchModule({ onComplete, onExit }: LaunchModuleProps) {
  const [checklist, setChecklist] = useState<CheckItem[]>(INITIAL_CHECKLIST);
  const [phase, setPhase] = useState<'checklist' | 'countdown' | 'launch' | 'result'>('checklist');
  const [countdown, setCountdown] = useState(10);
  const [launchProgress, setLaunchProgress] = useState(0);
  const [wrongOrder, setWrongOrder] = useState(0);

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    );
  };

  const allDone = checklist.every((i) => i.done);
  const allCritical = checklist.filter((i) => i.critical).every((i) => i.done);
  const doneCount = checklist.filter((i) => i.done).length;

  const handleLaunch = () => {
    if (!allCritical) return;
    setPhase('countdown');
    setCountdown(10);
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('launch');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  // Launch animation
  useEffect(() => {
    if (phase !== 'launch') return;
    const interval = setInterval(() => {
      setLaunchProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          // Calculate score
          const completionRatio = doneCount / checklist.length;
          const score = Math.round(completionRatio * 100 - wrongOrder * 5);
          const finalScore = Math.max(0, Math.min(100, score));
          const stars = finalScore >= 95 ? 3 : finalScore >= 80 ? 2 : finalScore >= 60 ? 1 : 0;
          setPhase('result');
          onComplete(finalScore, stars, Math.round(finalScore * 1.0));
          return 100;
        }
        return p + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [phase, doneCount, checklist.length, wrongOrder, onComplete]);

  if (phase === 'result') {
    const completionRatio = doneCount / checklist.length;
    const score = Math.max(0, Math.min(100, Math.round(completionRatio * 100 - wrongOrder * 5)));
    const stars = score >= 95 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
    return (
      <ModuleShell
        title="Launch Sequence"
        subtitle="Pre-flight checklist and liftoff"
        icon={<Rocket className="w-7 h-7" />}
        onExit={onExit}
      >
        <ResultScreen
          score={score}
          stars={stars}
          xpGained={Math.round(score * 1.0)}
          message={
            score >= 95
              ? `Perfect launch! You completed all ${checklist.length} checklist items with no errors. Liftoff achieved!`
              : score >= 80
                ? `Successful launch! You completed ${doneCount}/${checklist.length} items. The rocket is in orbit.`
                : `Launch achieved but with issues. You completed ${doneCount}/${checklist.length} items. Some systems were not fully checked.`
          }
          onContinue={onExit}
          onRetry={() => {
            setChecklist(INITIAL_CHECKLIST.map((i) => ({ ...i, done: false })));
            setWrongOrder(0);
            setLaunchProgress(0);
            setPhase('checklist');
          }}
        />
      </ModuleShell>
    );
  }

  if (phase === 'countdown') {
    return (
      <ModuleShell
        title="Launch Countdown"
        subtitle="All systems go — initiating sequence"
        icon={<Rocket className="w-7 h-7" />}
        onExit={onExit}
      >
        <div className="flex flex-col items-center justify-center py-20 space-y-8">
          <div className="relative">
            <div className={`text-8xl font-bold tabular-nums transition-all ${countdown <= 3 ? 'text-red-400' : 'text-white'}`}>
              {countdown}
            </div>
            {countdown <= 3 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-4 border-red-500/30 animate-ping" />
              </div>
            )}
          </div>
          <div className="text-slate-400 text-lg">
            {countdown > 3 ? 'All systems nominal...' : 'IGNITION!'}
          </div>
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-300">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </ModuleShell>
    );
  }

  if (phase === 'launch') {
    return (
      <ModuleShell
        title="Liftoff!"
        subtitle="Rocket ascending to orbit"
        icon={<Rocket className="w-7 h-7" />}
        onExit={onExit}
      >
        <div className="flex flex-col items-center justify-center py-20 space-y-8">
          {/* Rocket animation */}
          <div className="relative w-32 h-64">
            {/* Exhaust */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-32">
              <div className="w-full h-full bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full opacity-80 animate-pulse" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-24 bg-gradient-to-t from-white to-transparent rounded-full opacity-60" />
            </div>
            {/* Rocket body */}
            <div
              className="absolute left-1/2 -translate-x-1/2 transition-transform"
              style={{ transform: `translateY(${launchProgress * 0.3}px)` }}
            >
              <div className="w-12 h-32 bg-gradient-to-b from-slate-200 to-slate-400 rounded-t-2xl relative">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-900/80" />
                <div className="absolute -bottom-1 -left-2 w-4 h-8 bg-slate-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-2 w-4 h-8 bg-slate-500 rounded-br-lg" />
              </div>
            </div>
          </div>

          <div className="w-full max-w-sm">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Ascending to orbit</span>
              <span className="font-bold text-white">{launchProgress}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-100"
                style={{ width: `${launchProgress}%` }}
              />
            </div>
          </div>

          <div className="text-slate-300 text-sm">
            {launchProgress < 30 ? 'Main engines at full thrust...' :
             launchProgress < 60 ? 'Max-Q passed — throttling up...' :
             launchProgress < 90 ? 'Stage separation complete...' :
             'Orbital velocity achieved!'}
          </div>
        </div>
      </ModuleShell>
    );
  }

  // Checklist phase
  return (
    <ModuleShell
      title="Launch Sequence"
      subtitle="Complete every pre-flight check before liftoff"
      icon={<Rocket className="w-7 h-7" />}
      onExit={onExit}
    >
      <div className="space-y-5">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200">
          Complete all checklist items before launch. Critical items (marked with a warning icon) must be done — non-critical items improve your score. Check them in any order.
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${(doneCount / checklist.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-slate-400 tabular-nums">{doneCount}/{checklist.length}</span>
        </div>

        {/* Checklist grouped by category */}
        {CATEGORIES.map((cat) => {
          const items = checklist.filter((i) => i.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{cat}</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      item.done
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600 shrink-0" />
                    )}
                    <span className={`flex-1 text-sm ${item.done ? 'text-emerald-200 line-through' : 'text-slate-300'}`}>
                      {item.label}
                    </span>
                    {item.critical && (
                      <AlertTriangle className={`w-4 h-4 ${item.done ? 'text-emerald-500' : 'text-amber-400'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          disabled={!allCritical}
          className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            allCritical
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-500/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          {allCritical ? (
            <>
              <Rocket className="w-5 h-5" />
              INITIATE LAUNCH SEQUENCE
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5" />
              Complete all critical checks first
            </>
          )}
        </button>

        {!allCritical && allDone && (
          <p className="text-center text-xs text-amber-400">
            All items checked! But some critical items need to be done.
          </p>
        )}
      </div>
    </ModuleShell>
  );
}
