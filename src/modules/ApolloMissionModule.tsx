import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Moon, Rocket, RotateCcw, Flame } from 'lucide-react';
import { ModuleShell, ResultScreen } from '@/components/ModuleShell';
import {
  MISSION_QUIZ,
  STAGE_BRIEFS,
  STAGE_NAMES,
  hudRows,
  initialState,
  missionScore,
  stepStage,
} from '@/lib/apolloSim';
import type { Outcome, SimInput, SimState, StageIndex } from '@/lib/apolloSim';
import { CockpitRenderer } from '@/ui/apolloRenderer';
import type { CockpitFrame } from '@/ui/apolloRenderer';
import { SPACE_IMAGES } from '@/ui/spaceImages';
import type { GameState } from '@/types';

interface ApolloMissionModuleProps {
  state: GameState;
  onComplete: (score: number, stars: number, xp: number) => void;
  onExit: () => void;
}

type Phase = 'quiz' | 'quizResult' | 'brief' | 'flying' | 'stageResult' | 'complete';

const NO_INPUT: SimInput = { thrust: false, left: false, right: false };
const STAGE_EXTERIOR: Record<StageIndex, 'earth' | 'moon'> = { 0: 'earth', 1: 'earth', 2: 'moon' };
const QUIZ_PASS = 3;

function starsFor(score: number) {
  return score >= 90 ? 3 : score >= 70 ? 2 : 1;
}

function motionSpeedOf(s: SimState, thrust: boolean): number {
  const base = s.kind === 'landing' ? s.vd : s.sp;
  return (Math.max(0.3, Math.abs(base)) + (thrust ? 1.5 : 0));
}

export function ApolloMissionModule({ onComplete, onExit }: ApolloMissionModuleProps) {
  const [phase, setPhase] = useState<Phase>('quiz');
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizPicked, setQuizPicked] = useState<number | null>(null);
  const [stage, setStage] = useState<StageIndex>(0);
  const [attempts, setAttempts] = useState<number[]>([0, 0, 0]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [hud, setHud] = useState<[string, string][]>([]);

  // Simulation and input live in refs so the 60fps loop never re-renders React.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimState>(initialState(0));
  const inputRef = useRef<SimInput>({ ...NO_INPUT });
  const flyingRef = useRef(false);
  const stageRef = useRef<StageIndex>(0);
  const rendererRef = useRef<CockpitRenderer | null>(null);
  if (rendererRef.current === null) rendererRef.current = new CockpitRenderer();
  const imagesRef = useRef<Record<'earth' | 'moon' | 'cabin', HTMLImageElement> | null>(null);

  // Preload photographs once.
  useEffect(() => {
    const load = (src: string) => {
      const im = new Image();
      im.src = src;
      return im;
    };
    imagesRef.current = {
      earth: load(SPACE_IMAGES.earth),
      moon: load(SPACE_IMAGES.moon),
      cabin: load(SPACE_IMAGES.cabin),
    };
  }, []);

  // One render/simulation loop for the lifetime of the module.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let last = performance.now();
    let hudAccum = 0;

    const resize = () => {
      const d = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * d));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * d));
    };
    resize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const images = imagesRef.current;
      const input = inputRef.current;

      if (flyingRef.current) {
        const result = stepStage(simRef.current, input, dt);
        simRef.current = result.state;
        hudAccum += dt;
        if (hudAccum >= 0.15) {
          hudAccum = 0;
          setHud(hudRows(result.state));
        }
        if (result.outcome) {
          flyingRef.current = false;
          inputRef.current = { ...NO_INPUT };
          setHud(hudRows(result.state));
          setOutcome(result.outcome);
          setPhase('stageResult');
        }
      }

      const sim = simRef.current;
      const s = stageRef.current;
      const powered = flyingRef.current && input.thrust && sim.fuel > 0;
      const alt = sim.kind === 'tli' ? null : sim.alt;
      const angle = sim.kind === 'tli' ? 0 : sim.ang * 0.4;
      const progress =
        sim.kind === 'launch'
          ? Math.min(1, sim.alt / 300)
          : sim.kind === 'tli'
            ? Math.min(0.6, sim.px / 10000)
            : (300 - Math.max(0, sim.alt)) / 300;

      const frame: CockpitFrame = {
        exterior: images ? images[STAGE_EXTERIOR[s]] : null,
        cabin: images ? images.cabin : null,
        angle,
        progress,
        motionSpeed: flyingRef.current ? motionSpeedOf(sim, input.thrust) : 0,
        powered,
        alarm: false,
        readout: [
          ['ALT', alt === null ? '—' : alt.toFixed(0)],
          ['VEL', (sim.kind === 'landing' ? sim.vd : sim.sp).toFixed(2)],
          ['ATT', `${(sim.kind === 'tli' ? 0 : sim.ang).toFixed(1)}°`],
          ['ENG', powered ? 'BURN' : 'IDLE'],
        ],
      };

      const d = window.devicePixelRatio || 1;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      rendererRef.current?.draw(ctx, canvas.clientWidth, canvas.clientHeight, frame, now / 1000);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      flyingRef.current = false;
    };
  }, []);

  // Keyboard controls while flying.
  useEffect(() => {
    if (phase !== 'flying') return;
    const set = (key: string, value: boolean) => {
      if (key === 'ArrowLeft') inputRef.current.left = value;
      else if (key === 'ArrowRight') inputRef.current.right = value;
      else if (key === ' ' || key === 'ArrowUp') inputRef.current.thrust = value;
      else return false;
      return true;
    };
    const down = (e: KeyboardEvent) => {
      if (set(e.key, true)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      if (set(e.key, false)) e.preventDefault();
    };
    const blur = () => {
      inputRef.current = { ...NO_INPUT };
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      inputRef.current = { ...NO_INPUT };
    };
  }, [phase]);

  const holdControl = (key: keyof SimInput) => {
    const release = () => {
      inputRef.current[key] = false;
    };
    return {
      onPointerDown: (e: ReactPointerEvent) => {
        e.preventDefault();
        inputRef.current[key] = true;
      },
      onPointerUp: release,
      onPointerLeave: release,
      onPointerCancel: release,
    };
  };

  // ---- Pre-launch quiz -------------------------------------------------------
  const answerQuiz = (i: number) => {
    if (quizPicked !== null) return;
    setQuizPicked(i);
    if (i === MISSION_QUIZ[quizIdx].answer) setQuizCorrect((c) => c + 1);
  };

  const nextQuiz = () => {
    setQuizPicked(null);
    if (quizIdx + 1 < MISSION_QUIZ.length) {
      setQuizIdx((i) => i + 1);
    } else {
      setPhase('quizResult');
    }
  };

  const retryQuiz = () => {
    setQuizIdx(0);
    setQuizCorrect(0);
    setQuizPicked(null);
    setPhase('quiz');
  };

  // ---- Stage flow ------------------------------------------------------------
  const startStage = (s: StageIndex) => {
    stageRef.current = s;
    setStage(s);
    setOutcome(null);
    simRef.current = initialState(s);
    setHud(hudRows(simRef.current));
    setPhase('brief');
  };

  const launchStage = () => {
    const s = stageRef.current;
    setAttempts((a) => a.map((n, i) => (i === s ? n + 1 : n)));
    simRef.current = initialState(s);
    inputRef.current = { ...NO_INPUT };
    flyingRef.current = true;
    setPhase('flying');
  };

  const afterStage = () => {
    if (!outcome) return;
    if (!outcome.win) {
      startStage(stageRef.current);
      return;
    }
    if (stageRef.current < 2) {
      startStage((stageRef.current + 1) as StageIndex);
    } else {
      setPhase('complete');
    }
  };

  // Replay the three stages; the quiz result already counted toward the score.
  const restartMission = () => {
    setAttempts([0, 0, 0]);
    startStage(0);
  };

  const quizPassed = quizCorrect >= QUIZ_PASS;
  const score = missionScore(quizCorrect, attempts);
  const sim = simRef.current;
  const countdown =
    phase === 'flying' && sim.kind === 'launch' && sim.countdown > 0 ? Math.ceil(sim.countdown) : null;
  const brief = STAGE_BRIEFS[stage];

  return (
    <ModuleShell
      title="Apollo Mission Simulator"
      subtitle="Launch the Saturn V, burn for the Moon and land the Eagle"
      icon={<Moon className="h-7 w-7" />}
      onExit={onExit}
    >
      {phase === 'complete' ? (
        <ResultScreen
          score={score}
          stars={starsFor(score)}
          xpGained={Math.round(score * 0.8)}
          message="The Eagle has landed. You launched, burned for the Moon and touched down safely."
          onContinue={() => onComplete(score, starsFor(score), Math.round(score * 0.8))}
          onRetry={restartMission}
        />
      ) : (
        <div className="space-y-4">
          <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-[#02030a] aspect-[4/3] sm:aspect-[16/10]">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Cockpit view" />

            {phase === 'flying' && (
              <div className="pointer-events-none absolute right-2 top-2 min-w-[150px] rounded-lg border border-cyan-400/50 bg-slate-950/80 p-2.5 font-mono text-[11px] backdrop-blur">
                <div className="mb-1.5 text-center text-[10px] tracking-widest text-cyan-300">
                  {STAGE_NAMES[stage]}
                </div>
                {hud.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <span className="text-slate-400">{k}</span>
                    <span className="text-amber-300">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {countdown !== null && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center font-mono text-6xl font-black text-red-500 drop-shadow-[0_0_12px_rgba(0,0,0,0.9)]">
                {countdown}
              </div>
            )}

            {phase !== 'flying' && (
              <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-md text-center">
                  {phase === 'quiz' && (
                    <>
                      <p className="font-mono text-[10px] tracking-widest text-amber-300">
                        PRE-LAUNCH QUIZ {quizIdx + 1}/{MISSION_QUIZ.length}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold">{MISSION_QUIZ[quizIdx].q}</h3>
                      <div className="mt-4 grid gap-2 text-left">
                        {MISSION_QUIZ[quizIdx].options.map((o, i) => {
                          const correct = i === MISSION_QUIZ[quizIdx].answer;
                          const cls =
                            quizPicked === null
                              ? 'border-slate-600 hover:border-cyan-400'
                              : correct
                                ? 'border-emerald-400 bg-emerald-400/15'
                                : i === quizPicked
                                  ? 'border-red-400 bg-red-400/15'
                                  : 'border-slate-700 opacity-50';
                          return (
                            <button
                              key={o}
                              disabled={quizPicked !== null}
                              onClick={() => answerQuiz(i)}
                              className={`rounded-xl border px-4 py-2.5 text-sm transition ${cls}`}
                            >
                              {o}
                            </button>
                          );
                        })}
                      </div>
                      {quizPicked !== null && (
                        <>
                          <p className="mt-3 text-sm text-slate-300">
                            {quizPicked === MISSION_QUIZ[quizIdx].answer ? '✅ Correct. ' : '❌ Not quite. '}
                            {MISSION_QUIZ[quizIdx].why}
                          </p>
                          <button onClick={nextQuiz} className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-2.5 font-bold text-white">
                            {quizIdx + 1 < MISSION_QUIZ.length ? 'Next ▶' : 'See mission control verdict ▶'}
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {phase === 'quizResult' && (
                    <>
                      <p className="font-mono text-[10px] tracking-widest text-amber-300">MISSION CONTROL</p>
                      <h3 className="mt-2 text-2xl font-black">{quizPassed ? 'GO FOR LAUNCH' : 'NO-GO'}</h3>
                      <p className="mt-2 text-sm text-slate-300">
                        Score {quizCorrect}/{MISSION_QUIZ.length}.{' '}
                        {quizPassed
                          ? 'Mission control is satisfied. Proceed to the launch pad.'
                          : `You need at least ${QUIZ_PASS} correct answers. Study up and try again.`}
                      </p>
                      <button
                        onClick={quizPassed ? () => startStage(0) : retryQuiz}
                        className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-2.5 font-bold text-white"
                      >
                        {quizPassed ? 'To the launch pad ▶' : 'Retry quiz'}
                      </button>
                    </>
                  )}

                  {phase === 'brief' && (
                    <>
                      <p className="font-mono text-[10px] tracking-widest text-amber-300">
                        STAGE {stage + 1} OF 3 · {STAGE_NAMES[stage]}
                      </p>
                      <h3 className="mt-2 text-xl font-bold">{brief.title}</h3>
                      <ul className="mt-3 space-y-1 text-left text-sm text-slate-300">
                        {brief.objective.map((o) => (
                          <li key={o}>• {o}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-sm text-slate-400">{brief.controls}</p>
                      <button onClick={launchStage} className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-400 to-amber-300 py-2.5 font-bold text-slate-950">
                        Start stage
                      </button>
                    </>
                  )}

                  {phase === 'stageResult' && outcome && (
                    <>
                      <p className="font-mono text-[10px] tracking-widest text-amber-300">
                        {outcome.win ? 'SUCCESS' : 'MISSION FAILED'}
                      </p>
                      <h3 className="mt-2 text-xl font-bold">
                        {outcome.win
                          ? stage < 2
                            ? `${STAGE_NAMES[stage]} complete`
                            : 'Mission complete'
                          : brief.title}
                      </h3>
                      <p className="mt-3 text-sm text-slate-300">{outcome.message}</p>
                      <button onClick={afterStage} className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-2.5 font-bold text-white">
                        {outcome.win ? (stage < 2 ? 'Next stage ▶' : 'Finish mission ▶') : 'Retry stage'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {phase === 'flying' && (
            <div className="flex items-end justify-between gap-3 select-none">
              <div className="flex gap-2">
                <button
                  aria-label="Tilt left"
                  className="grid h-14 w-14 touch-none place-items-center rounded-full border-2 border-sky-300/60 bg-sky-900/60 text-xl text-white active:brightness-125 sm:h-16 sm:w-16"
                  {...holdControl('left')}
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <button
                  aria-label="Tilt right"
                  className="grid h-14 w-14 touch-none place-items-center rounded-full border-2 border-sky-300/60 bg-sky-900/60 text-xl text-white active:brightness-125 sm:h-16 sm:w-16"
                  {...holdControl('right')}
                >
                  <RotateCcw className="h-5 w-5 -scale-x-100" />
                </button>
              </div>
              <button
                aria-label="Thrust"
                className="grid h-20 w-20 touch-none place-items-center rounded-full border-2 border-orange-200/70 bg-gradient-to-br from-orange-400 to-red-700 text-white active:brightness-125 sm:h-24 sm:w-24"
                {...holdControl('thrust')}
              >
                <Flame className="h-8 w-8" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Rocket className="h-3.5 w-3.5" /> Stage {Math.min(stage + 1, 3)} / 3
            </span>
            <span>Keys: ← → tilt · Space thrust · Hold on-screen buttons on phones</span>
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
