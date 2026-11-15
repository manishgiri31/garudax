import { lazy, Suspense, useEffect, useState } from 'react';
import { ChevronLeft, Gauge, List, Lock, CheckCircle2 } from 'lucide-react';
import { ResultScreen } from '@/components/ModuleShell';
import { CURRICULUM, scoredItemCount } from '@/lib/cockpitCurriculum';
import type { ControlId } from '@/lib/cockpitCurriculum';
import type { GameState } from '@/types';

const Cockpit3D = lazy(() => import('@/ui/Cockpit3D'));

interface CockpitAcademyModuleProps {
  state: GameState;
  onComplete: (score: number, stars: number, xp: number) => void;
  onExit: () => void;
}

const TOTAL_ITEMS = scoredItemCount();

function starsFor(score: number) {
  return score >= 90 ? 3 : score >= 70 ? 2 : 1;
}

export function CockpitAcademyModule({ onComplete, onExit }: CockpitAcademyModuleProps) {
  const [unlocked, setUnlocked] = useState(1);
  const [levelIdx, setLevelIdx] = useState<number | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState<Set<ControlId>>(new Set());
  const [missed, setMissed] = useState(false);
  const [earned, setEarned] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());

  // Clear the red flash timer if the module closes mid-flash.
  useEffect(() => {
    if (!flashing) return;
    const t = setTimeout(() => setFlashing(false), 600);
    return () => clearTimeout(t);
  }, [flashing]);

  const level = levelIdx !== null ? CURRICULUM[levelIdx] : null;
  const step = level?.steps[stepIdx];
  const levelDone = !!level && stepIdx >= level.steps.length;

  const startLevel = (i: number) => {
    setLevelIdx(i);
    setStepIdx(0);
    setPicked(null);
    setDone(new Set());
    setMissed(false);
  };

  const advance = () => {
    if (levelIdx === null || !level) return;
    setPicked(null);
    setMissed(false);
    setStepIdx((n) => n + 1);
    if (stepIdx + 1 >= level.steps.length) {
      // Finishing a level unlocks the next one.
      setUnlocked((u) => Math.max(u, Math.min(levelIdx + 2, CURRICULUM.length)));
      setCompletedLevels((s) => new Set(s).add(levelIdx));
    }
  };

  const pressSwitch = (id: ControlId) => {
    if (step?.kind !== 'action') return;
    if (id === step.control) {
      setDone((d) => new Set(d).add(id));
      if (!missed) setEarned((e) => e + 1);
      advance();
    } else {
      setMissed(true);
      setFlashing(true);
    }
  };

  const answerQuiz = (i: number) => {
    if (picked !== null || step?.kind !== 'quiz') return;
    setPicked(i);
    if (i === step.answer) setEarned((e) => e + 1);
  };

  const restart = () => {
    setUnlocked(1);
    setLevelIdx(null);
    setStepIdx(0);
    setPicked(null);
    setDone(new Set());
    setMissed(false);
    setEarned(0);
    setFinished(false);
    setCompletedLevels(new Set());
  };

  const allLevelsDone = completedLevels.size === CURRICULUM.length;
  const score = Math.round((earned / TOTAL_ITEMS) * 100);

  if (finished) {
    return (
      <div className="min-h-screen bg-[#02030a] text-white">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <ResultScreen
            score={score}
            stars={starsFor(score)}
            xpGained={Math.round(score * 0.8)}
            message="You flew the full cockpit curriculum: switches, checklists, quizzes and emergency drills. Your first-try accuracy sets your score."
            onContinue={() => onComplete(score, starsFor(score), Math.round(score * 0.8))}
            onRetry={restart}
          />
        </div>
      </div>
    );
  }

  const alarm = !!level?.alarm && !levelDone && !done.has('comms');
  const shake = !!level?.shake && done.has('engine') && !done.has('sep');
  const target = step?.kind === 'action' ? step.control : null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#02030a] text-white">
      <Suspense
        fallback={
          <div className="grid h-full place-items-center font-mono text-sm tracking-widest text-cyan-300">
            BOARDING SPACECRAFT…
          </div>
        }
      >
        <Cockpit3D
          view={level?.view ?? 'earth'}
          alarm={alarm}
          shake={shake}
          target={target}
          done={done}
          onPress={pressSwitch}
        />
      </Suspense>

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
        <button
          onClick={onExit}
          className="pointer-events-auto flex items-center gap-1 rounded-lg border border-cyan-400/60 bg-slate-950/80 px-3 py-1.5 font-mono text-xs text-cyan-300 hover:border-cyan-300"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Base
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-600 bg-slate-950/80 px-3 py-1 font-mono text-xs text-slate-300">
            CHECKS {earned}/{TOTAL_ITEMS}
          </span>
          {level && (
            <button
              onClick={() => setLevelIdx(null)}
              className="pointer-events-auto flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-1.5 font-mono text-xs text-slate-200 hover:border-slate-400"
            >
              <List className="h-3.5 w-3.5" /> Levels
            </button>
          )}
        </div>
      </header>

      {flashing && <div className="pointer-events-none absolute inset-0 bg-red-600/25" />}

      {!level && (
        <div className="absolute inset-0 overflow-y-auto bg-slate-950/75 px-4 pb-8 pt-16 backdrop-blur-sm">
          <div className="mx-auto max-w-xl">
            <div className="mb-1 flex items-center justify-center gap-2 text-cyan-300">
              <Gauge className="h-5 w-5" />
              <h2 className="font-mono text-xl font-bold tracking-wider">3D COCKPIT ACADEMY</h2>
            </div>
            <p className="mb-5 text-center text-sm text-slate-400">
              You're in the commander's seat. Finish each level to unlock the next. Drag to look around.
            </p>
            <div className="grid gap-3">
              {CURRICULUM.map((lvl, i) => {
                const locked = i >= unlocked;
                return (
                  <button
                    key={lvl.id}
                    disabled={locked}
                    onClick={() => startLevel(i)}
                    className="flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-left transition enabled:hover:border-cyan-400/60 disabled:opacity-40"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-800 text-2xl">
                      {locked ? <Lock className="h-5 w-5 text-slate-500" /> : lvl.icon}
                    </span>
                    <span className="flex-1">
                      <span className="block font-mono text-[10px] tracking-widest text-cyan-400">{lvl.level.toUpperCase()}</span>
                      <span className="block font-semibold">{lvl.title}</span>
                    </span>
                    {i < unlocked - 1 && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setFinished(true)}
              disabled={!allLevelsDone}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {allLevelsDone
                ? 'Finish Cockpit Academy'
                : `Complete all ${CURRICULUM.length} levels to finish`}
            </button>
          </div>
        </div>
      )}

      {level && (
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="mx-auto max-w-xl rounded-2xl border border-cyan-400/40 bg-slate-950/90 p-4 shadow-2xl backdrop-blur">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] tracking-widest text-cyan-300">
              <span>{level.title.toUpperCase()}</span>
              <span>{Math.min(stepIdx + 1, level.steps.length)} / {level.steps.length}</span>
            </div>
            <div className="mb-3 h-1 overflow-hidden rounded bg-slate-800">
              <div
                className="h-1 rounded bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all"
                style={{ width: `${(stepIdx / level.steps.length) * 100}%` }}
              />
            </div>

            {levelDone && (
              <div className="text-center">
                <h3 className="font-mono text-lg font-bold text-emerald-300">LEVEL COMPLETE</h3>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setLevelIdx(null)} className="flex-1 rounded-xl border border-slate-600 py-2.5 text-slate-200">
                    Levels
                  </button>
                  {levelIdx !== null && levelIdx + 1 < CURRICULUM.length && !allLevelsDone ? (
                    <button onClick={() => startLevel(levelIdx + 1)} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-2.5 font-semibold">
                      Next level ▶
                    </button>
                  ) : (
                    <button onClick={() => setFinished(true)} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 py-2.5 font-semibold">
                      Finish academy ▶
                    </button>
                  )}
                </div>
              </div>
            )}

            {step?.kind === 'info' && (
              <>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{step.text}</p>
                <button onClick={advance} className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-2.5 font-semibold">
                  Continue ▶
                </button>
              </>
            )}

            {step?.kind === 'action' && (
              <>
                <p className="font-mono text-[10px] tracking-widest text-amber-300">CHECKLIST ACTION</p>
                <h3 className="mt-1 text-lg font-semibold">{step.text}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Tap the glowing switch on the console: <b className="text-amber-300">{step.hint}</b>
                </p>
              </>
            )}

            {step?.kind === 'quiz' && (
              <>
                <p className="font-mono text-[10px] tracking-widest text-amber-300">KNOWLEDGE CHECK</p>
                <h3 className="mt-1 font-semibold">{step.q}</h3>
                <div className="mt-2 grid gap-2">
                  {step.options.map((o, i) => {
                    const cls =
                      picked === null
                        ? 'border-slate-700 hover:border-cyan-400/60'
                        : i === step.answer
                          ? 'border-emerald-400 bg-emerald-400/15'
                          : i === picked
                            ? 'border-red-400 bg-red-400/15'
                            : 'border-slate-700 opacity-50';
                    return (
                      <button
                        key={o}
                        disabled={picked !== null}
                        onClick={() => answerQuiz(i)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition ${cls}`}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
                {picked !== null && (
                  <>
                    <p className="mt-2 text-sm">
                      {picked === step.answer ? '✅ Correct. ' : '❌ Not quite. '}
                      {step.why}
                    </p>
                    <button onClick={advance} className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-2.5 font-semibold">
                      Next ▶
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
