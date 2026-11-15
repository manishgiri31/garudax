import {
  Radio,
  Crosshair,
  Gauge,
  Star,
  Award,
  RotateCcw,
  Lock,
  CheckCircle2,
  CircleDot,
  PlayCircle,
  Rocket,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { MODULES, ALL_BADGES, levelFromXP, xpProgress } from '@/lib/gameState';
import type { GameState, ModuleId, ModuleProgress } from '@/types';
import { useVoice } from './useVoice';
import { useSound } from './useSound';
import { missionControlStageOpen } from './missionControl';
import './outpost.css';

// Our own crew callsigns, one per training module. Not real people.
const CALLSIGNS = ['NOVA', 'KESTREL', 'HALO', 'VEGA', 'ORBIT', 'SIRIUS', 'LUMEN', 'CAIRN'];

interface OutpostScreenProps {
  state: GameState;
  onStart: (id: ModuleId) => void;
  onReset: () => void;
}

interface Row {
  index: number;
  id: ModuleId;
  name: string;
  tagline: string;
  callsign: string;
  progress: ModuleProgress;
}

function StatusIcon({ status }: { status: ModuleProgress['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'in-progress':
      return <PlayCircle className="w-4 h-4 text-blue-400" />;
    case 'available':
      return <CircleDot className="w-4 h-4 text-cyan-400" />;
    default:
      return <Lock className="w-4 h-4 text-slate-600" />;
  }
}

function Panel({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-slate-900/70 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 ${className}`}
    >
      <header className="flex items-center gap-2 mb-3 text-[11px] tracking-[0.2em] uppercase text-slate-400">
        {icon}
        <span>{title}</span>
      </header>
      {children}
    </section>
  );
}

export function OutpostScreen({ state, onStart, onReset }: OutpostScreenProps) {
  const level = levelFromXP(state.totalXP);
  const prog = xpProgress(state.totalXP);
  const voice = useVoice();
  const sound = useSound();
  const [confirmReset, setConfirmReset] = useState(false);

  const rows: Row[] = MODULES.map((m, i) => ({
    index: i,
    id: m.id,
    name: m.name,
    tagline: m.tagline,
    callsign: CALLSIGNS[i] ?? `UNIT-${i + 1}`,
    progress: state.modules.find((mp) => mp.moduleId === m.id) ?? {
      moduleId: m.id,
      status: 'locked',
      score: 0,
      stars: 0,
      completedAt: null,
    },
  }));

  const done = rows.filter((r) => r.progress.status === 'completed').length;
  const stars = rows.reduce((s, r) => s + r.progress.stars, 0);
  const earned = state.badges.filter((b) => b.earned);
  const objective =
    rows.find((r) => r.progress.status === 'in-progress') ??
    rows.find((r) => r.progress.status === 'available') ??
    null;
  const allDone = done === MODULES.length;

  // Starting a stage: Mission Control announces it (if voice is on), then the stage opens.
  const startStage = (r: Row) => {
    voice.speak(missionControlStageOpen(r.name, r.tagline));
    onStart(r.id);
  };

  return (
    <div className="min-h-screen relative text-white bg-[#02030a] outpost-root">
      <div className="outpost-stage-bg" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-5">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-cyan-400/40 bg-cyan-400/10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-[11px] tracking-[0.25em] text-cyan-300/80 uppercase">Outpost</div>
              <h1 className="text-lg font-bold tracking-tight">Astro Cadet Academy</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">
              Callsign <span className="text-white font-semibold">{state.recruitName}</span>
            </span>
            {sound.supported && (
              <button
                onClick={sound.toggle}
                aria-pressed={sound.enabled}
                title="Sound effects"
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  sound.enabled
                    ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sound.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                Sound: {sound.enabled ? 'On' : 'Off'}
              </button>
            )}
            {voice.supported && (
              <button
                onClick={voice.toggle}
                aria-pressed={voice.enabled}
                title="Mission Control voice"
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  voice.enabled
                    ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {voice.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Voice: {voice.enabled ? 'On' : 'Off'}
              </button>
            )}
            <button
              onClick={() => setConfirmReset(true)}
              className="text-slate-500 hover:text-red-400 transition-colors"
              title="Reset progress"
              aria-label="Reset progress"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: crew column */}
          <aside className="order-2 lg:order-1 lg:col-span-3">
            <Panel title="Crew roster" icon={<Radio className="w-4 h-4" />}>
              <ol className="space-y-1.5">
                {rows.map((r) => {
                  const locked = r.progress.status === 'locked';
                  const isCurrent = objective?.id === r.id;
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => !locked && startStage(r)}
                        disabled={locked}
                        className={`w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left border transition-colors ${
                          isCurrent
                            ? 'border-cyan-400/50 bg-cyan-400/10'
                            : 'border-transparent hover:border-slate-700 hover:bg-slate-800/40'
                        } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <span className="text-[10px] font-mono text-slate-500 w-4">
                          {String(r.index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-xs font-bold tracking-wider text-white">{r.callsign}</div>
                          <div className="text-[11px] text-slate-400 truncate">{r.name}</div>
                        </div>
                        <StatusIcon status={r.progress.status} />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          </aside>

          {/* Centre: stage objective card */}
          <main className="order-1 lg:order-2 lg:col-span-6">
            <section className="outpost-objective rounded-xl border border-cyan-400/30 p-5 sm:p-6 min-h-[320px] flex flex-col">
              <div className="flex items-center justify-between text-[11px] tracking-[0.2em] uppercase text-cyan-300/90 mb-4">
                <span className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4" />
                  Stage objective
                </span>
                <span className="font-mono text-slate-300">
                  {objective
                    ? `${String(objective.index + 1).padStart(2, '0')} / ${String(MODULES.length).padStart(2, '0')}`
                    : `${String(done).padStart(2, '0')} / ${String(MODULES.length).padStart(2, '0')}`}
                </span>
              </div>

              {objective ? (
                <div className="flex-1 flex flex-col">
                  <div className="text-xs font-mono text-slate-400 mb-1">
                    {objective.callsign} · {objective.progress.status === 'in-progress' ? 'In progress' : 'Ready'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{objective.name}</h2>
                  <p className="text-slate-300 mt-2 max-w-md">{objective.tagline}</p>

                  <div className="mt-auto pt-6">
                    <div className="flex gap-1 mb-4" aria-label="Objective track">
                      {rows.map((r) => (
                        <span
                          key={r.id}
                          className={`h-1.5 flex-1 rounded-full ${
                            r.progress.status === 'completed'
                              ? 'bg-emerald-400'
                              : r.id === objective.id
                                ? 'bg-cyan-300'
                                : r.progress.status === 'locked'
                                  ? 'bg-slate-800'
                                  : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => startStage(objective)}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="w-5 h-5" />
                      {objective.progress.status === 'in-progress' ? 'Resume objective' : 'Begin objective'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Award className="w-12 h-12 text-amber-400 mb-3" />
                  <h2 className="text-2xl font-bold">{allDone ? 'Certified Astronaut' : 'Track clear'}</h2>
                  <p className="text-slate-300 mt-2">
                    {allDone
                      ? `All ${MODULES.length} objectives complete. Well done, ${state.recruitName}.`
                      : 'No objective is open right now.'}
                  </p>
                </div>
              )}
            </section>
          </main>

          {/* Right: telemetry stack */}
          <aside className="order-3 lg:order-3 lg:col-span-3 space-y-4">
            <Panel title="Rank" icon={<Gauge className="w-4 h-4" />}>
              <div className="flex items-end justify-between mb-2">
                <div className="text-3xl font-bold font-mono">L{level}</div>
                <div className="text-sm font-mono text-blue-300">{state.totalXP} XP</div>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${prog.pct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 font-mono">
                {prog.current}/{prog.needed} to next level
              </div>
            </Panel>

            <Panel title="Telemetry" icon={<Gauge className="w-4 h-4" />}>
              <dl className="grid grid-cols-2 gap-2">
                <Stat label="Modules" value={`${done}/${MODULES.length}`} />
                <Stat label="Stars" value={`${stars}/${MODULES.length * 3}`} icon={<Star className="w-3 h-3 text-yellow-400" />} />
                <Stat label="Badges" value={`${earned.length}/${ALL_BADGES.length}`} />
                <Stat label="Screening" value={state.eligibility ? 'Cleared' : 'Pending'} />
              </dl>
            </Panel>

            <Panel title="Assignment" icon={<Crosshair className="w-4 h-4" />}>
              <div className="text-sm">
                {state.mission ? (
                  <span className="font-semibold text-white capitalize">{state.mission} ops</span>
                ) : (
                  <span className="text-slate-400">Unassigned</span>
                )}
              </div>
              {earned.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {earned.slice(0, 4).map((b) => (
                    <li key={b.id} className="text-xs text-amber-200 flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      {b.name}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </aside>
        </div>

        <footer className="mt-6 text-[11px] text-slate-500 leading-relaxed">
          Earth image: NASA / JPL Photojournal PIA18033,{' '}
          <a
            href="https://www.jpl.nasa.gov/images/pia18033-earth/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-slate-300"
          >
            source
          </a>
          . Callsigns are fictional.
        </footer>
      </div>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Reset all progress?</h3>
            <p className="text-slate-400 text-sm">
              This will erase your XP, badges, and all module completions. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmReset(false);
                  onReset();
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

function Stat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-800/50 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
        {icon}
        {label}
      </dt>
      <dd className="font-mono font-bold text-white text-sm mt-0.5">{value}</dd>
    </div>
  );
}
