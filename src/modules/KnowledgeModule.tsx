import { useState } from 'react';
import { BookOpen, Globe, Wind, Radiation, Orbit, CheckCircle2, SlidersHorizontal, Zap } from 'lucide-react';
import { ModuleShell, ResultScreen } from '@/components/ModuleShell';
import { SpaceFlightViewport } from '@/components/SpaceFlightViewport';
import { KNOWLEDGE_TOPICS } from '@/lib/trainingData';
import type { GameState, KnowledgeTopic } from '@/types';

interface KnowledgeModuleProps {
  state: GameState;
  onComplete: (score: number, stars: number, xp: number) => void;
  onExit: () => void;
}

const ICON_MAP: Record<string, typeof BookOpen> = { Globe, Wind, Radiation, Orbit };

export function KnowledgeModule({ onComplete, onExit }: KnowledgeModuleProps) {
  const [currentTopic, setCurrentTopic] = useState<KnowledgeTopic>(KNOWLEDGE_TOPICS[0]);
  const [activated, setActivated] = useState<Set<string>>(new Set());
  const [oxygen, setOxygen] = useState(78);
  const [pressure, setPressure] = useState(101);
  const [gravity, setGravity] = useState(42);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'control' | 'result'>('control');

  const selectTopic = (topic: KnowledgeTopic) => {
    setCurrentTopic(topic);
    setActivated((items) => new Set(items).add(topic.id));
    setScore((value) => Math.min(100, value + 8));
  };

  const complete = () => {
    const finalScore = Math.max(score, Math.round((activated.size / KNOWLEDGE_TOPICS.length) * 100));
    setScore(finalScore);
    setPhase('result');
    onComplete(finalScore, finalScore >= 90 ? 3 : finalScore >= 70 ? 2 : 1, Math.round(finalScore * .8));
  };

  if (phase === 'result') return <ModuleShell title="Space Knowledge" subtitle="Environmental controls certified" icon={<BookOpen className="w-7 h-7" />} onExit={onExit}><ResultScreen score={score} stars={score >= 90 ? 3 : score >= 70 ? 2 : 1} xpGained={Math.round(score * .8)} message="You learned to read the spacecraft environment and kept the cabin inside safe operating limits." onContinue={onExit} onRetry={() => { setActivated(new Set()); setScore(0); setPhase('control'); }} /></ModuleShell>;

  const Icon = ICON_MAP[currentTopic.icon] || BookOpen;
  const cabinSafe = oxygen >= 70 && oxygen <= 90 && pressure >= 95 && pressure <= 105;

  return (
    <ModuleShell title="Space Knowledge" subtitle="Control the environment and see the physics respond" icon={<BookOpen className="w-7 h-7" />} onExit={onExit}>
      <div className="space-y-5">
        <SpaceFlightViewport mode="orbit" onScore={(value) => setScore((current) => Math.min(100, current + value))} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {KNOWLEDGE_TOPICS.map((topic) => { const TopicIcon = ICON_MAP[topic.icon] || BookOpen; const active = topic.id === currentTopic.id; return <button key={topic.id} onClick={() => selectTopic(topic)} className={`rounded-xl border p-3 text-left transition-all ${active ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'}`}><TopicIcon className={`mb-2 h-5 w-5 ${active ? 'text-cyan-300' : 'text-slate-500'}`} /><span className="block text-xs font-bold text-white">{topic.title}</span><span className="mt-1 block text-[10px] text-slate-500">{activated.has(topic.id) ? 'MONITORED' : 'OFFLINE'}</span></button>; })}
        </div>
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5">
          <div className="mb-2 flex items-center gap-2"><Icon className="h-5 w-5 text-cyan-300" /><h3 className="font-bold text-white">{currentTopic.title}</h3></div>
          <p className="mb-4 leading-relaxed text-slate-300">{currentTopic.summary}</p>
          <div className="grid gap-2 sm:grid-cols-2">{currentTopic.facts.slice(0, 4).map((fact, index) => <div key={fact} className="flex gap-2 rounded-lg bg-slate-800/50 p-3 text-xs text-slate-300"><span className="font-mono text-cyan-400">0{index + 1}</span><span>{fact}</span></div>)}</div>
        </div>
        <div className="rounded-2xl border border-slate-700/60 bg-black/45 p-5">
          <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-amber-300" /><h3 className="font-bold text-white">Cabin Environment Console</h3></div><span className={`font-mono text-xs ${cabinSafe ? 'text-emerald-300' : 'text-red-300'}`}>{cabinSafe ? 'NOMINAL' : 'ALERT'}</span></div>
          <ControlSlider label="OXYGEN MIX" value={oxygen} min={50} max={100} unit="%" onChange={setOxygen} safe={oxygen >= 70 && oxygen <= 90} />
          <ControlSlider label="CABIN PRESSURE" value={pressure} min={70} max={120} unit="kPa" onChange={setPressure} safe={pressure >= 95 && pressure <= 105} />
          <ControlSlider label="SIMULATED GRAVITY" value={gravity} min={0} max={100} unit="%" onChange={setGravity} safe={gravity >= 20 && gravity <= 60} />
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span className="flex items-center gap-1"><Zap className="h-3 w-3 text-yellow-400" /> CALIBRATION SCORE {score}%</span><span>{activated.size}/{KNOWLEDGE_TOPICS.length} ENVIRONMENTS MONITORED</span></div>
        </div>
        <button onClick={complete} disabled={activated.size < KNOWLEDGE_TOPICS.length || !cabinSafe} className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 py-3.5 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40">{cabinSafe ? 'Certify Environmental Training' : 'Return cabin controls to nominal range'}</button>
      </div>
    </ModuleShell>
  );
}

function ControlSlider({ label, value, min, max, unit, onChange, safe }: { label: string; value: number; min: number; max: number; unit: string; onChange: (value: number) => void; safe: boolean }) {
  return <label className="mb-4 block"><div className="mb-2 flex justify-between font-mono text-[10px] text-slate-400"><span>{label}</span><span className={safe ? 'text-emerald-300' : 'text-red-300'}>{value}{unit}</span></div><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-cyan-400" /></label>;
}
