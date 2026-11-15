import { useState, useEffect, useRef, useCallback } from 'react';
import { Plane, Fuel, AlertTriangle, RotateCcw, Mountain } from 'lucide-react';
import { ModuleShell, ResultScreen } from '@/components/ModuleShell';
import type { GameState } from '@/types';
import { playThud, startRumble } from '@/ui/sound';
import '../ui/cockpit.css';

interface LandingModuleProps {
  state: GameState;
  onComplete: (score: number, stars: number, xp: number) => void;
  onExit: () => void;
}

const CANVAS_W = 600;
const CANVAS_H = 450;
const GRAVITY = 0.05;
const THRUST = 0.12;
const MAX_SAFE_VY = 2.5;
const MAX_SAFE_VX = 1.5;
const FUEL_START = 100;
const THRUST_FUEL = 0.4;
const SIDE_FUEL = 0.2;

interface ShipState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  thrusting: boolean;
}

export function LandingModule({ onComplete, onExit }: LandingModuleProps) {
  const [phase, setPhase] = useState<'briefing' | 'game' | 'result'>('briefing');
  const [ship, setShip] = useState<ShipState>({
    x: CANVAS_W / 2,
    y: 50,
    vx: 0,
    vy: 0,
    angle: 0,
    thrusting: false,
  });
  const [fuel, setFuel] = useState(FUEL_START);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [altitude, setAltitude] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [result, setResult] = useState<{ success: boolean; message: string; score: number } | null>(null);
  const [particles, setParticles] = useState<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const animRef = useRef<number>(0);
  const shipRef = useRef(ship);
  const fuelRef = useRef(fuel);
  const keysRef = useRef(keys);
  const particleRef = useRef(particles);
  const phaseRef = useRef(phase);

  // Scale the fixed-size lander view down to fit narrow screens (visual only).
  const stageRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setFit(Math.min(1, el.clientWidth / CANVAS_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase]);

  // Terrain — flat landing pad in the middle
  const TERRAIN_HEIGHTS = generateTerrain();

  function generateTerrain(): number[] {
    const heights: number[] = [];
    const padStart = Math.floor(CANVAS_W * 0.35);
    const padEnd = Math.floor(CANVAS_W * 0.65);
    const padY = CANVAS_H - 50;

    for (let x = 0; x < CANVAS_W; x += 5) {
      if (x >= padStart && x <= padEnd) {
        heights.push(padY);
      } else {
        // Jagged terrain
        const baseY = CANVAS_H - 30 - Math.sin(x * 0.02) * 20 - Math.cos(x * 0.05) * 15;
        heights.push(baseY + Math.random() * 10);
      }
    }
    return heights;
  }

  const PAD_START = Math.floor(CANVAS_W * 0.35);
  const PAD_END = Math.floor(CANVAS_W * 0.65);
  const PAD_Y = CANVAS_H - 50;

  // Keep refs in sync
  useEffect(() => { shipRef.current = ship; }, [ship]);
  useEffect(() => { fuelRef.current = fuel; }, [fuel]);
  useEffect(() => { keysRef.current = keys; }, [keys]);
  useEffect(() => { particleRef.current = particles; }, [particles]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Audio only: low rumble while the engine is firing, and one thud when the result lands.
  useEffect(() => {
    if (phase !== 'game' || !ship.thrusting) return;
    return startRumble();
  }, [phase, ship.thrusting]);
  useEffect(() => {
    if (result) playThud();
  }, [result]);

  // Keyboard
  useEffect(() => {
    if (phase !== 'game') return;
    const handleDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowleft', 'arrowright', ' ', 'w', 'a', 'd'].includes(key)) {
        e.preventDefault();
        setKeys((prev) => new Set(prev).add(key));
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const n = new Set(prev);
        n.delete(e.key.toLowerCase());
        return n;
      });
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [phase]);

  const checkCollision = useCallback((s: ShipState): 'pad' | 'crash' | 'none' => {
    const shipBottom = s.y + 15;
    const shipLeft = s.x - 12;
    const shipRight = s.x + 12;

    // Check landing pad
    if (shipBottom >= PAD_Y && shipLeft >= PAD_START && shipRight <= PAD_END) {
      return 'pad';
    }

    // Check terrain
    for (let i = 0; i < TERRAIN_HEIGHTS.length; i++) {
      const terrainX = i * 5;
      if (shipRight >= terrainX && shipLeft <= terrainX + 5) {
        if (shipBottom >= TERRAIN_HEIGHTS[i]) {
          // Check if it's the pad area
          if (terrainX >= PAD_START && terrainX <= PAD_END && Math.abs(s.angle) < 15) {
            return 'pad';
          }
          return 'crash';
        }
      }
    }

    // Out of bounds
    if (s.x < 0 || s.x > CANVAS_W || s.y > CANVAS_H) return 'crash';

    return 'none';
  }, []);

  // Game loop
  useEffect(() => {
    if (phase !== 'game') return;

    const loop = () => {
      if (phaseRef.current !== 'game') return;

      const k = keysRef.current;
      const currentFuel = fuelRef.current;
      let s = { ...shipRef.current };
      let newFuel = currentFuel;
      let thrusting = false;

      // Apply gravity
      s.vy += GRAVITY;

      // Thrust
      if ((k.has('arrowup') || k.has(' ') || k.has('w')) && newFuel > 0) {
        s.vy -= THRUST;
        newFuel -= THRUST_FUEL;
        thrusting = true;
        // Add exhaust particles
        if (Math.random() < 0.6) {
          setParticles((prev) => [
            ...prev.slice(-20),
            {
              x: s.x + (Math.random() - 0.5) * 6,
              y: s.y + 15,
              vx: (Math.random() - 0.5) * 1,
              vy: 2 + Math.random() * 2,
              life: 1,
            },
          ]);
        }
      }

      // Side thrust
      if ((k.has('arrowleft') || k.has('a')) && newFuel > 0) {
        s.vx -= 0.05;
        s.angle = Math.max(-20, s.angle - 1);
        newFuel -= SIDE_FUEL;
      } else if ((k.has('arrowright') || k.has('d')) && newFuel > 0) {
        s.vx += 0.05;
        s.angle = Math.min(20, s.angle + 1);
        newFuel -= SIDE_FUEL;
      } else {
        // Level out
        s.angle *= 0.9;
      }

      // Apply velocity
      s.x += s.vx;
      s.y += s.vy;

      // Damp horizontal slightly
      s.vx *= 0.995;

      s.thrusting = thrusting;

      // Update HUD values
      setAltitude(Math.max(0, Math.round((PAD_Y - s.y) / 5)));
      setSpeed(Math.round(Math.sqrt(s.vx * s.vx + s.vy * s.vy) * 10));

      // Check collision
      const collision = checkCollision(s);
      if (collision !== 'none') {
        const totalSpeed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        const onPad = collision === 'pad';
        const safeSpeed = Math.abs(s.vy) < MAX_SAFE_VY && Math.abs(s.vx) < MAX_SAFE_VX;
        const goodAngle = Math.abs(s.angle) < 10;

        if (onPad && safeSpeed && goodAngle) {
          const fuelBonus = newFuel / FUEL_START;
          const score = Math.round(60 + fuelBonus * 40);
          setResult({
            success: true,
            message: `Perfect landing! Touchdown velocity: ${Math.abs(s.vy).toFixed(2)} m/s. Fuel remaining: ${Math.round(newFuel)}%.`,
            score,
          });
          onComplete(score, score >= 90 ? 3 : score >= 75 ? 2 : 1, Math.round(score * 1.2));
        } else if (onPad) {
          const score = 40;
          setResult({
            success: false,
            message: `You landed on the pad but too hard! Vertical speed: ${Math.abs(s.vy).toFixed(2)} m/s (max safe: ${MAX_SAFE_VY}). The lander was damaged.`,
            score,
          });
          onComplete(score, 1, Math.round(score * 0.8));
        } else {
          const score = 0;
          setResult({
            success: false,
            message: `Crash! The lander hit terrain at ${totalSpeed.toFixed(2)} m/s. You missed the landing pad.`,
            score,
          });
          onComplete(score, 0, 10);
        }
        setPhase('result');
        return;
      }

      setShip(s);
      setFuel(newFuel);

      // Update particles
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
          .filter((p) => p.life > 0)
      );

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, checkCollision, onComplete]);

  const startGame = () => {
    setPhase('game');
    setShip({ x: CANVAS_W / 2 + (Math.random() - 0.5) * 100, y: 50, vx: (Math.random() - 0.5) * 1, vy: 0, angle: 0, thrusting: false });
    setFuel(FUEL_START);
    setParticles([]);
    setResult(null);
  };

  if (phase === 'briefing') {
    return (
      <ModuleShell
        title="Landing Simulation"
        subtitle="Pilot the lander to a safe touchdown"
        icon={<Plane className="w-7 h-7" />}
        onExit={onExit}
      >
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-400/5 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Lander Pilot Training</h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              You are approaching the destination. Your lander is descending under gravity. Use thrust to slow your descent and navigate to the flat landing pad. Touch down gently — too fast and you crash!
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/40 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-1">Thrust</div>
                <div className="text-sm text-white">↑ / W / Space</div>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-1">Steer</div>
                <div className="text-sm text-white">← → / A D</div>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-1">Max descent speed</div>
                <div className="text-sm text-white">{MAX_SAFE_VY} m/s</div>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-3">
                <div className="text-xs text-slate-400 mb-1">Goal</div>
                <div className="text-sm text-white">Land on the flat pad</div>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200">
              Watch your fuel! Each thrust burn consumes fuel. Land with fuel to spare for bonus points. Keep the lander level — excessive tilt causes crashes.
            </p>
          </div>

          <button
            onClick={startGame}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            Begin Descent
          </button>
        </div>
      </ModuleShell>
    );
  }

  if (phase === 'result' && result) {
    const stars = result.score >= 90 ? 3 : result.score >= 75 ? 2 : result.score >= 40 ? 1 : 0;
    return (
      <ModuleShell
        title="Landing Simulation"
        subtitle="Descent complete"
        icon={<Plane className="w-7 h-7" />}
        onExit={onExit}
      >
        <ResultScreen
          score={result.score}
          stars={stars}
          xpGained={Math.round(result.score * 1.2)}
          message={result.message}
          onContinue={onExit}
          onRetry={startGame}
        />
      </ModuleShell>
    );
  }

  // Game phase
  return (
    <ModuleShell
      title="Landing Simulation"
      subtitle="Guide the lander to the pad"
      icon={<Plane className="w-7 h-7" />}
      onExit={onExit}
    >
      <div className="cockpit space-y-3">
        {/* Cockpit windows: NASA Earth views either side, the lander view in the middle */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_minmax(0,2fr)_1fr] gap-2 sm:gap-3 items-stretch">
          <CockpitWindow className="hidden sm:block" side="port" />

          <div
            ref={stageRef}
            className="cockpit-glass relative rounded-2xl overflow-hidden bg-[#02030a]"
            style={{ height: CANVAS_H * fit }}
          >
            <div
              className="absolute left-0 top-0"
              style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${fit})`, transformOrigin: 'top left' }}
            >
              {/* Stars */}
              {[...Array(40)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/20"
                  style={{
                    left: `${(i * 47) % CANVAS_W}px`,
                    top: `${(i * 31) % (CANVAS_H * 0.6)}px`,
                    width: `${1 + (i % 2)}px`,
                    height: `${1 + (i % 2)}px`,
                  }}
                />
              ))}

              {/* Terrain */}
              <svg className="absolute inset-0" width={CANVAS_W} height={CANVAS_H}>
                <polygon
                  points={`0,${CANVAS_H} ${TERRAIN_HEIGHTS.map((h, i) => `${i * 5},${h}`).join(' ')} ${CANVAS_W},${CANVAS_H}`}
                  fill="#1a2a1a"
                  stroke="#2d4a2d"
                  strokeWidth="1"
                />
                {/* Landing pad */}
                <rect x={PAD_START} y={PAD_Y - 3} width={PAD_END - PAD_START} height={6} fill="#22d3ee" opacity="0.6" />
                <rect x={PAD_START} y={PAD_Y - 1} width={PAD_END - PAD_START} height={2} fill="#67e8f9" />
                <text x={(PAD_START + PAD_END) / 2} y={PAD_Y - 8} fill="#67e8f9" fontSize="10" textAnchor="middle" fontWeight="bold">
                  LZ
                </text>
              </svg>

              {/* Exhaust particles */}
              {particles.map((p, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: p.x - 2,
                    top: p.y - 2,
                    width: 4,
                    height: 4,
                    background: `rgba(255, ${100 + p.life * 155}, 0, ${p.life})`,
                  }}
                />
              ))}

              {/* Lander */}
              <div
                className="absolute"
                style={{
                  left: ship.x - 12,
                  top: ship.y - 15,
                  width: 24,
                  height: 30,
                  transform: `rotate(${ship.angle}deg)`,
                  transformOrigin: 'center center',
                }}
              >
                <div className="w-6 h-5 bg-gradient-to-b from-slate-300 to-slate-500 rounded-t-md mx-auto" />
                <div className="w-3 h-2 bg-blue-600/80 rounded-sm mx-auto -mt-4" />
                <div className="flex justify-between px-0">
                  <div className="w-1 h-4 bg-slate-400 -rotate-12" />
                  <div className="w-1 h-4 bg-slate-400 rotate-12" />
                </div>
                {ship.thrusting && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-7 w-3 h-8 bg-gradient-to-b from-white via-yellow-400 to-orange-600 rounded-full animate-pulse opacity-90" />
                )}
              </div>
            </div>
            <div className="absolute top-2 left-2 text-[10px] tracking-[0.2em] uppercase text-cyan-200/80 pointer-events-none">
              Lander view
            </div>
          </div>

          <CockpitWindow className="hidden sm:block" side="starboard" />
        </div>

        {/* Flight panel */}
        <div className="cockpit-panel rounded-2xl border border-slate-600/60 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Instrument label="Altitude" value={`${altitude} m`} />
          <Instrument
            label="Speed"
            value={`${speed}`}
            tone={speed > 25 ? 'red' : speed > 18 ? 'amber' : 'emerald'}
          />
          <Instrument label="Attitude" value={`${Math.round(ship.angle)}°`} />
          <div className="rounded-xl bg-slate-950/60 border border-slate-700/60 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Fuel className="w-3 h-3 text-emerald-400" />
              Fuel
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${fuel > 30 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, fuel))}%` }}
              />
            </div>
            <div className="text-xs font-mono text-slate-300 mt-1 tabular-nums">{Math.round(fuel)}%</div>
          </div>
        </div>

        {/* Key legend: arrows and WASD both work */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="rounded-lg bg-slate-900/70 border border-slate-700/60 px-3 py-2">
            <span className="font-semibold text-cyan-300">Thrust</span>{' '}
            <kbd className="kbd">↑</kbd> <kbd className="kbd">W</kbd> <kbd className="kbd">Space</kbd>
          </div>
          <div className="rounded-lg bg-slate-900/70 border border-slate-700/60 px-3 py-2">
            <span className="font-semibold text-cyan-300">Steer</span>{' '}
            <kbd className="kbd">←</kbd> <kbd className="kbd">A</kbd> &nbsp;/&nbsp; <kbd className="kbd">→</kbd> <kbd className="kbd">D</kbd>
          </div>
        </div>

        {/* Touch controls for phones */}
        <div className="flex justify-center sm:hidden">
          <div className="grid grid-cols-3 gap-2 w-56">
            <div />
            <TouchBtn2 label="THRUST" onPress={() => setKeys((p) => new Set(p).add(' '))} onRelease={() => setKeys((p) => { const n = new Set(p); n.delete(' '); return n; })} />
            <div />
            <TouchBtn2 label="←" onPress={() => setKeys((p) => new Set(p).add('arrowleft'))} onRelease={() => setKeys((p) => { const n = new Set(p); n.delete('arrowleft'); return n; })} />
            <TouchBtn2 label="↓" onPress={() => setKeys((p) => new Set(p).add('arrowdown'))} onRelease={() => setKeys((p) => { const n = new Set(p); n.delete('arrowdown'); return n; })} />
            <TouchBtn2 label="→" onPress={() => setKeys((p) => new Set(p).add('arrowright'))} onRelease={() => setKeys((p) => { const n = new Set(p); n.delete('arrowright'); return n; })} />
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Earth imagery: NASA / JPL Photojournal PIA18033. Simulated cabin for training.
        </p>
      </div>
    </ModuleShell>
  );
}

function CockpitWindow({ className = '', side }: { className?: string; side: 'port' | 'starboard' }) {
  return (
    <div className={`cockpit-window cockpit-glass relative rounded-2xl overflow-hidden ${side === 'port' ? 'cockpit-window--port' : 'cockpit-window--starboard'} ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/70" />
      <div className="absolute top-2 left-2 text-[10px] tracking-[0.2em] uppercase text-cyan-200/80">
        {side === 'port' ? 'Port' : 'Starboard'} view
      </div>
    </div>
  );
}

function Instrument({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'red' | 'amber' | 'emerald' }) {
  const color = { slate: 'text-white', red: 'text-red-400', amber: 'text-amber-400', emerald: 'text-emerald-400' }[tone];
  return (
    <div className="rounded-xl bg-slate-950/60 border border-slate-700/60 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 font-mono text-lg font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function TouchBtn2({ label, onPress, onRelease }: { label: string; onPress: () => void; onRelease: () => void }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onPress(); }}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      onPointerCancel={onRelease}
      className="aspect-square rounded-xl bg-slate-800 border border-slate-600 text-white text-sm font-bold active:bg-blue-500/30 active:border-blue-500 transition-colors flex items-center justify-center"
    >
      {label}
    </button>
  );
}
