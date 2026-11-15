import { useState, useEffect, useRef, useCallback } from 'react';
import { Footprints, Timer, Target, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from 'lucide-react';
import { ModuleShell, ResultScreen } from '@/components/ModuleShell';
import type { GameState } from '@/types';

interface PhysicalModuleProps {
  state: GameState;
  onComplete: (score: number, stars: number, xp: number) => void;
  onExit: () => void;
}

interface TargetPos {
  x: number;
  y: number;
  id: number;
}

const CANVAS_W = 600;
const CANVAS_H = 400;
const ASTRONAUT_SIZE = 30;
const TARGET_SIZE = 24;

export function PhysicalModule({ onComplete, onExit }: PhysicalModuleProps) {
  const [phase, setPhase] = useState<'briefing' | 'game' | 'result'>('briefing');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetsHit, setTargetsHit] = useState(0);
  const [targets, setTargets] = useState<TargetPos[]>([]);
  const [astronautPos, setAstronautPos] = useState({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [fuel, setFuel] = useState(100);
  const animRef = useRef<number>(0);
  const nextTargetId = useRef(0);

  // Generate targets
  const spawnTargets = useCallback((count: number) => {
    const newTargets: TargetPos[] = [];
    for (let i = 0; i < count; i++) {
      newTargets.push({
        x: 50 + Math.random() * (CANVAS_W - 100),
        y: 50 + Math.random() * (CANVAS_H - 100),
        id: nextTargetId.current++,
      });
    }
    setTargets(newTargets);
  }, []);

  // Keyboard handling
  useEffect(() => {
    if (phase !== 'game') return;
    const handleDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
        setKeys((prev) => new Set(prev).add(key));
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [phase]);

  // Game loop
  useEffect(() => {
    if (phase !== 'game') return;

    const loop = () => {
      setVelocity((prevVel) => {
        let { x, y } = prevVel;
        const thrust = 0.3;
        let usedFuel = false;

        if (keys.has('arrowleft') || keys.has('a')) { x -= thrust; usedFuel = true; }
        if (keys.has('arrowright') || keys.has('d')) { x += thrust; usedFuel = true; }
        if (keys.has('arrowup') || keys.has('w')) { y -= thrust; usedFuel = true; }
        if (keys.has('arrowdown') || keys.has('s')) { y += thrust; usedFuel = true; }

        if (usedFuel) setFuel((f) => Math.max(0, f - 0.15));

        // Damping (simulating slight space resistance / stabilization)
        x *= 0.99;
        y *= 0.99;

        // Cap velocity
        const maxV = 5;
        x = Math.max(-maxV, Math.min(maxV, x));
        y = Math.max(-maxV, Math.min(maxV, y));

        setAstronautPos((prev) => {
          let nx = prev.x + x;
          let ny = prev.y + y;
          // Bounce off walls
          if (nx < ASTRONAUT_SIZE / 2) { nx = ASTRONAUT_SIZE / 2; x = -x * 0.5; }
          if (nx > CANVAS_W - ASTRONAUT_SIZE / 2) { nx = CANVAS_W - ASTRONAUT_SIZE / 2; x = -x * 0.5; }
          if (ny < ASTRONAUT_SIZE / 2) { ny = ASTRONAUT_SIZE / 2; y = -y * 0.5; }
          if (ny > CANVAS_H - ASTRONAUT_SIZE / 2) { ny = CANVAS_H - ASTRONAUT_SIZE / 2; y = -y * 0.5; }
          return { x: nx, y: ny };
        });

        return { x, y };
      });

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, keys]);

  // Target collision
  useEffect(() => {
    if (phase !== 'game') return;
    setTargets((prev) => {
      const remaining = prev.filter((t) => {
        const dx = t.x - astronautPos.x;
        const dy = t.y - astronautPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < (ASTRONAUT_SIZE + TARGET_SIZE) / 2) {
          setTargetsHit((h) => h + 1);
          setScore((s) => s + 10);
          return false;
        }
        return true;
      });
      if (remaining.length === 0 && prev.length > 0) {
        // Spawn more
        const newOnes: TargetPos[] = [];
        for (let i = 0; i < 3; i++) {
          newOnes.push({
            x: 50 + Math.random() * (CANVAS_W - 100),
            y: 50 + Math.random() * (CANVAS_H - 100),
            id: nextTargetId.current++,
          });
        }
        return [...remaining, ...newOnes];
      }
      return remaining;
    });
  }, [astronautPos, phase]);

  // Timer
  useEffect(() => {
    if (phase !== 'game') return;
    if (timeLeft <= 0) {
      const finalScore = Math.min(100, score);
      const stars = finalScore >= 80 ? 3 : finalScore >= 50 ? 2 : finalScore >= 30 ? 1 : 0;
      setPhase('result');
      onComplete(finalScore, stars, Math.round(finalScore * 0.9));
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, timeLeft, score, onComplete]);

  const startGame = () => {
    setPhase('game');
    setScore(0);
    setTimeLeft(30);
    setTargetsHit(0);
    setFuel(100);
    setAstronautPos({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
    setVelocity({ x: 0, y: 0 });
    spawnTargets(3);
  };

  if (phase === 'briefing') {
    return (
      <ModuleShell
        title="Physical Training"
        subtitle="Spacewalk maneuvering in microgravity"
        icon={<Footprints className="w-7 h-7" />}
        onExit={onExit}
      >
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-400/5 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Spacewalk Training</h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              In microgravity, movement requires careful thrust control. There's no friction to stop you — every push creates momentum that must be countered. This simulation trains your spatial awareness and thrust discipline.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Target className="w-4 h-4 text-cyan-400" />
                Navigate to the glowing targets to collect them
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <ArrowUp className="w-4 h-4 text-cyan-400" />
                Use Arrow keys or WASD to thrust in each direction
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <Timer className="w-4 h-4 text-cyan-400" />
                You have 30 seconds. Each target = 10 points. Manage your fuel!
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300">W</kbd>
                </div>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300">A</kbd>
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300">S</kbd>
                  <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300">D</kbd>
                </div>
                <span className="text-xs text-slate-500 mt-1">Thrust controls</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <Target className="w-8 h-8 text-cyan-400" />
                <span className="text-xs text-slate-500 mt-1">Collect targets</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <Timer className="w-8 h-8 text-amber-400" />
                <span className="text-xs text-slate-500 mt-1">30s time limit</span>
              </div>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            Begin Spacewalk
          </button>
        </div>
      </ModuleShell>
    );
  }

  if (phase === 'result') {
    const stars = score >= 80 ? 3 : score >= 50 ? 2 : score >= 30 ? 1 : 0;
    return (
      <ModuleShell
        title="Physical Training"
        subtitle="Spacewalk simulation complete"
        icon={<Footprints className="w-7 h-7" />}
        onExit={onExit}
      >
        <ResultScreen
          score={Math.min(100, score)}
          stars={stars}
          xpGained={Math.round(Math.min(100, score) * 0.9)}
          message={`You collected ${targetsHit} targets in 30 seconds with a score of ${Math.min(100, score)}%. ${score >= 80 ? 'Outstanding spatial control!' : score >= 50 ? 'Good thrust discipline!' : 'Keep practicing your microgravity movement.'}`}
          onContinue={onExit}
          onRetry={startGame}
        />
      </ModuleShell>
    );
  }

  // Game phase
  return (
    <ModuleShell
      title="Spacewalk Training"
      subtitle="Collect targets using thrust controls"
      icon={<Footprints className="w-7 h-7" />}
      onExit={onExit}
    >
      <div className="space-y-4">
        {/* HUD bar */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-700/50 rounded-xl px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white tabular-nums">{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white tabular-nums">{targetsHit}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-sm">Score:</span>
              <span className="font-bold text-white tabular-nums">{score}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Fuel:</span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${fuel > 30 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${fuel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Game canvas */}
        <div className="relative bg-[#02030a] border border-slate-700/50 rounded-2xl overflow-hidden mx-auto" style={{ maxWidth: `${CANVAS_W}px` }}>
          <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
            {/* Stars background */}
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/30"
                style={{
                  left: `${(i * 37) % CANVAS_W}px`,
                  top: `${(i * 53) % CANVAS_H}px`,
                  width: `${1 + (i % 3)}px`,
                  height: `${1 + (i % 3)}px`,
                }}
              />
            ))}

            {/* Targets */}
            {targets.map((t) => (
              <div
                key={t.id}
                className="absolute rounded-full border-2 border-cyan-400 bg-cyan-400/20 animate-pulse"
                style={{
                  left: t.x - TARGET_SIZE / 2,
                  top: t.y - TARGET_SIZE / 2,
                  width: TARGET_SIZE,
                  height: TARGET_SIZE,
                  boxShadow: '0 0 12px rgba(34,211,238,0.6)',
                }}
              >
                <div className="absolute inset-1.5 rounded-full bg-cyan-400/40" />
              </div>
            ))}

            {/* Astronaut */}
            <div
              className="absolute transition-none"
              style={{
                left: astronautPos.x - ASTRONAUT_SIZE / 2,
                top: astronautPos.y - ASTRONAUT_SIZE / 2,
                width: ASTRONAUT_SIZE,
                height: ASTRONAUT_SIZE,
              }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 to-slate-400 border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-900/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex justify-center sm:hidden">
          <div className="grid grid-cols-3 gap-2 w-48">
            <div />
            <TouchBtn label="↑" onPress={() => setKeys((p) => new Set(p).add('arrowup'))} onRelease={() => setKeys((p) => { const n = new Set(p); n.delete('arrowup'); return n; })} />
            <div />
            <TouchBtn label="←" onPress={() => setKeys((p) => new Set(p).add('arrowleft'))} onRelease={() => setKeys((p) => { const n = new Set(p); n.delete('arrowleft'); return n; })} />
            <TouchBtn label="↓" onPress={() => setKeys((p) => new Set(p).add('arrowdown'))} onRelease={() => setKeys((p) => { const n = new Set(p); n.delete('arrowdown'); return n; })} />
            <TouchBtn label="→" onPress={() => setKeys((p) => new Set(p).add('arrowright'))} onRelease={() => setKeys((p) => { const n = new Set(p); n.delete('arrowright'); return n; })} />
          </div>
        </div>

        <p className="text-center text-sm text-slate-500">
          Use Arrow keys or WASD to thrust. Bounce off walls to navigate.
        </p>
      </div>
    </ModuleShell>
  );
}

function TouchBtn({ label, onPress, onRelease }: { label: string; onPress: () => void; onRelease: () => void }) {
  return (
    <button
      onPointerDown={onPress}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      className="aspect-square rounded-xl bg-slate-800 border border-slate-600 text-white text-xl font-bold active:bg-blue-500/30 active:border-blue-500 transition-colors"
    >
      {label}
    </button>
  );
}
