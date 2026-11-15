import { useState } from 'react';
import { Cpu, Wrench, Gauge, Sun, Radio, CircuitBoard, CheckCircle2, Zap } from 'lucide-react';
import { ModuleShell, ResultScreen } from '@/components/ModuleShell';
import { SpaceFlightViewport } from '@/components/SpaceFlightViewport';
import type { GameState } from '@/types';

interface RoboticsModuleProps {
  state: GameState;
  onComplete: (score: number, stars: number, xp: number) => void;
  onExit: () => void;
}

const SYSTEM_GUIDES = [
  { icon: Wrench, title: 'Robotic Arm', content: 'Move the arm with precision. Keep the payload inside the capture corridor and use small attitude corrections.' },
  { icon: Sun, title: 'Power Grid', content: 'Route solar power toward life support and propulsion. Watch the load before firing thrusters.' },
  { icon: Gauge, title: 'Attitude', content: 'Yaw, pitch, and roll keep the vehicle pointed correctly. Stabilize before every maneuver.' },
  { icon: Radio, title: 'Communications', content: 'A clear signal keeps mission control in the loop. Maintain a stable link during transfer burns.' },
  { icon: CircuitBoard, title: 'Life Support', content: 'ECLSS protects oxygen, pressure, humidity, and temperature. Never let one system drift unattended.' },
];

export function RoboticsModule({ onComplete, onExit }: RoboticsModuleProps) {
  const [currentGuide, setCurrentGuide] = useState(0);
  const [readGuides, setReadGuides] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'control' | 'result'>('control');
  const guide = SYSTEM_GUIDES[currentGuide];

  const markSystem = () => {
    const next = new Set(readGuides).add(currentGuide);
    setReadGuides(next);
    setScore((value) => Math.min(100, value + 20));
    if (currentGuide < SYSTEM_GUIDES.length - 1) setCurrentGuide((value) => value + 1);
    else {
      const finalScore = Math.min(100, score + 20);
      setScore(finalScore);
      setPhase('result');
      onComplete(finalScore, finalScore >= 90 ? 3 : finalScore >= 70 ? 2 : 1, Math.round(finalScore * .9));
    }
  };

  if (phase === 'result') return <ModuleShell title="Robotics & Operations" subtitle="Systems control certification" icon={<Cpu className="w-7 h-7" />} onExit={onExit}><ResultScreen score={score} stars={score >= 90 ? 3 : score >= 70 ? 2 : 1} xpGained={Math.round(score * .9)} message="You operated the spacecraft systems directly and completed the control certification." onContinue={onExit} onRetry={() => { setReadGuides(new Set()); setScore(0); setCurrentGuide(0); setPhase('control'); }} /></ModuleShell>;

  return (
    <ModuleShell title="Robotics & Operations" subtitle="Operate the spacecraft systems in real time" icon={<Cpu className="w-7 h-7" />} onExit={onExit}>
      <div className="space-y-5">
        <SpaceFlightViewport mode="systems" onScore={(value) => setScore((current) => Math.min(100, current + value))} />
        <div className="flex items-center justify-between font-mono text-xs text-slate-400"><span>SYSTEM {currentGuide + 1} / {SYSTEM_GUIDES.length}</span><span className="text-cyan-300">CONTROL SCORE {score}%</span></div>
        <div className="grid grid-cols-5 gap-2">
          {SYSTEM_GUIDES.map((system, index) => { const Icon = system.icon; return <button key={system.title} onClick={() => setCurrentGuide(index)} className={`rounded-lg border p-2 text-center transition-all ${index === currentGuide ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200' : readGuides.has(index) ? 'border-emerald-500/30 text-emerald-300' : 'border-slate-700 bg-slate-900/60 text-slate-500'}`}><Icon className="mx-auto mb-1 h-4 w-4" /> <span className="block truncate text-[10px]">{system.title}</span>{readGuides.has(index) && <CheckCircle2 className="mx-auto mt-1 h-3 w-3" />}</button>; })}
        </div>
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5">
          <div className="mb-2 flex items-center gap-2"><Zap className="h-4 w-4 text-amber-400" /><h3 className="font-bold text-white">{guide.title}</h3></div>
          <p className="leading-relaxed text-slate-300">{guide.content}</p>
          <button onClick={markSystem} className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 font-bold text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25">{currentGuide === SYSTEM_GUIDES.length - 1 ? 'Confirm All Systems' : 'Acknowledge & Operate System'}</button>
        </div>
      </div>
    </ModuleShell>
  );
}
