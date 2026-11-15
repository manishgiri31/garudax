import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { RotateCcw, Menu, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Gauge, Radio } from 'lucide-react';
import { CockpitRenderer } from '@/ui/apolloRenderer';
import type { CockpitFrame } from '@/ui/apolloRenderer';
import { SPACE_IMAGES } from '@/ui/spaceImages';

interface SpaceFlightViewportProps {
  mode?: 'orbit' | 'systems' | 'transfer';
  onScore?: (score: number) => void;
}

// Orbit view: NASA photographs seen through the cabin windows (TrueBlend approach),
// replacing the illustrated spacecraft. Attitude controls tilt the scenery and
// thrust sets how fast it drifts past.

export function SpaceFlightViewport({ mode = 'orbit', onScore }: SpaceFlightViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thrust, setThrust] = useState(42);
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [paused, setPaused] = useState(false);
  const [targets, setTargets] = useState(3);
  const [message, setMessage] = useState('FLIGHT COMPUTER NOMINAL');

  // The loop reads the latest controls through a ref so it is not rebuilt on every press.
  const controlsRef = useRef({ thrust, pitch, yaw, mode });
  controlsRef.current = { thrust, pitch, yaw, mode };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const renderer = new CockpitRenderer();
    const images = {
      earth: new Image(),
      moon: new Image(),
      mars: new Image(),
      cabin: new Image(),
    };
    images.earth.src = SPACE_IMAGES.earth;
    images.moon.src = SPACE_IMAGES.moon;
    images.mars.src = SPACE_IMAGES.mars;
    images.cabin.src = SPACE_IMAGES.cabin;

    let raf = 0;
    let t = 0;
    let running = !paused;

    const resize = () => {
      const d = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * d));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * d));
    };
    resize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);

    const draw = () => {
      const { thrust: th, pitch: roll, yaw: turn, mode: view } = controlsRef.current;
      t += 0.016;
      const burning = th > 4;
      const frame: CockpitFrame = {
        exterior: images[view === 'systems' ? 'moon' : view === 'transfer' ? 'mars' : 'earth'],
        cabin: images.cabin,
        angle: roll * 0.4,
        progress: Math.min(1, th / 100),
        motionSpeed: burning ? 0.5 + th * 0.05 : 0.3,
        powered: burning,
        alarm: false,
        readout: [
          ['ALT', (401 + th).toFixed(1)],
          ['ROLL', roll.toFixed(1)],
          ['PITCH', (12 + turn * 0.2).toFixed(1)],
          ['YAW', turn.toFixed(1)],
        ],
      };
      const d = window.devicePixelRatio || 1;
      context.setTransform(d, 0, 0, d, 0, 0);
      renderer.draw(context, canvas.clientWidth, canvas.clientHeight, frame, t);
      if (running) raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [paused]);

  const adjust = (type: 'pitch' | 'yaw' | 'thrust', amount: number) => {
    if (type === 'pitch') setPitch((value) => Math.max(-90, Math.min(90, value + amount)));
    if (type === 'yaw') setYaw((value) => Math.max(-90, Math.min(90, value + amount)));
    if (type === 'thrust') setThrust((value) => Math.max(0, Math.min(100, value + amount)));
    setMessage('MANEUVER INPUT ACCEPTED');
    onScore?.(1);
  };

  const stabilize = () => {
    setPitch(0);
    setYaw(0);
    setThrust(42);
    setMessage('ATTITUDE STABILIZED');
    onScore?.(5);
  };

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-700 bg-black shadow-2xl shadow-cyan-950/30">
      <div className="relative aspect-[16/9] min-h-[260px]">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Cockpit window view" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,.36))] pointer-events-none" />
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded bg-black/55 px-2 py-1 font-mono text-[10px] text-slate-200">
          <span className={`h-2 w-2 rounded-full bg-emerald-400 ${paused ? '' : 'animate-pulse'}`} />
          {paused ? 'PAUSED' : 'LIVE'} / {mode.toUpperCase()}
        </div>
        <div className="absolute right-3 top-3 flex gap-2">
          <button onClick={() => setPaused((value) => !value)} className="rounded-full border border-white/25 bg-slate-900/75 p-2 text-slate-200 hover:bg-slate-700" aria-label="Pause simulation"><Eye className="h-4 w-4" /></button>
          <button onClick={stabilize} className="rounded-full border border-white/25 bg-slate-900/75 p-2 text-slate-200 hover:bg-slate-700" aria-label="Stabilize attitude"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={() => setMessage('SYSTEM MENU READY')} className="rounded-full border border-white/25 bg-slate-900/75 p-2 text-slate-200 hover:bg-slate-700" aria-label="Open system menu"><Menu className="h-4 w-4" /></button>
        </div>
        <div className="absolute bottom-3 left-3 rounded border border-white/20 bg-black/60 px-2 py-1 font-mono text-[10px] text-slate-200">
          <span className="text-emerald-300">TARGETS:</span> {targets}/3
        </div>
        <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-emerald-300">{message}</div>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-slate-800 bg-slate-950/95 p-3 sm:grid-cols-4">
        <ControlButton icon={<ArrowLeft />} label="YAW -" onClick={() => adjust('yaw', -5)} />
        <ControlButton icon={<ArrowUp />} label="THRUST +" onClick={() => adjust('thrust', 8)} active={thrust > 60} />
        <ControlButton icon={<ArrowDown />} label="THRUST -" onClick={() => adjust('thrust', -8)} />
        <ControlButton icon={<ArrowRight />} label="YAW +" onClick={() => adjust('yaw', 5)} />
      </div>
      <div className="flex items-center justify-between border-t border-slate-800 bg-black/70 px-3 py-2 font-mono text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><Gauge className="h-3 w-3 text-cyan-400" /> VELOCITY {Math.round(thrust * 18)} KM/S</span>
        <span className="flex items-center gap-1"><Radio className="h-3 w-3 text-emerald-400" /> SIGNAL 98%</span>
      </div>
    </div>
  );
}

function ControlButton({ icon, label, onClick, active = false }: { icon: ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 font-mono text-[10px] transition-all ${active ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,.2)]' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-500 hover:text-white'}`}>{icon}<span>{label}</span></button>;
}
