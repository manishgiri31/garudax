import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { RotateCcw, Menu, Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Gauge, Radio } from 'lucide-react';

interface SpaceFlightViewportProps {
  mode?: 'orbit' | 'systems' | 'transfer';
  onScore?: (score: number) => void;
}

export function SpaceFlightViewport({ mode = 'orbit', onScore }: SpaceFlightViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thrust, setThrust] = useState(42);
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [paused, setPaused] = useState(false);
  const [targets, setTargets] = useState(3);
  const [message, setMessage] = useState('FLIGHT COMPUTER NOMINAL');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let frame = 0;
    let raf = 0;
    const stars = Array.from({ length: 110 }, (_, index) => ({
      x: (index * 83) % 1000,
      y: (index * 47) % 560,
      r: index % 4 === 0 ? 1.6 : 0.8,
    }));

    const draw = () => {
      frame += 0.012;
      const width = canvas.width;
      const height = canvas.height;
      context.fillStyle = '#020305';
      context.fillRect(0, 0, width, height);

      stars.forEach((star, index) => {
        const alpha = 0.35 + Math.abs(Math.sin(frame * 1.6 + index)) * 0.6;
        context.fillStyle = `rgba(220,235,255,${alpha})`;
        context.beginPath();
        context.arc((star.x / 1000) * width, (star.y / 560) * height, star.r, 0, Math.PI * 2);
        context.fill();
      });

      const planetX = mode === 'transfer' ? width * 0.77 : width * 0.18;
      const planetY = height * 0.66;
      const planetRadius = mode === 'systems' ? 74 : 52;
      const planet = context.createRadialGradient(planetX - 18, planetY - 18, 4, planetX, planetY, planetRadius);
      planet.addColorStop(0, mode === 'transfer' ? '#cbd5e1' : '#7dd3fc');
      planet.addColorStop(0.55, mode === 'transfer' ? '#64748b' : '#2563eb');
      planet.addColorStop(1, '#07152e');
      context.fillStyle = planet;
      context.beginPath();
      context.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = 'rgba(126, 247, 75, 0.9)';
      context.lineWidth = 2;
      context.beginPath();
      if (mode === 'transfer') {
        context.moveTo(width * 0.12, height * 0.42);
        context.quadraticCurveTo(width * 0.5, height * 0.08, width * 0.87, height * 0.5);
      } else {
        context.ellipse(planetX, planetY, width * 0.34, height * 0.29, -0.08, 0, Math.PI * 2);
      }
      context.stroke();

      const shipX = width * (0.49 + Math.sin(frame * 0.45) * 0.035);
      const shipY = height * (0.46 + Math.cos(frame * 0.45) * 0.04);
      context.save();
      context.translate(shipX, shipY);
      context.rotate((pitch + yaw) * 0.01 + Math.sin(frame) * 0.04);
      context.fillStyle = '#e7edf4';
      context.beginPath();
      context.moveTo(-30, 0);
      context.lineTo(20, -13);
      context.lineTo(34, 0);
      context.lineTo(20, 13);
      context.closePath();
      context.fill();
      context.fillStyle = '#d69e2e';
      context.fillRect(-11, -16, 20, 32);
      context.fillStyle = '#1e3a8a';
      context.beginPath();
      context.arc(11, -3, 5, 0, Math.PI * 2);
      context.fill();
      if (thrust > 4) {
        context.fillStyle = '#f8fafc';
        context.shadowColor = '#38bdf8';
        context.shadowBlur = 18;
        context.beginPath();
        context.moveTo(-28, -5);
        context.lineTo(-62 - thrust * 0.35, 0);
        context.lineTo(-28, 5);
        context.closePath();
        context.fill();
        context.shadowBlur = 0;
      }
      context.restore();

      if (!paused) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [mode, paused, pitch, thrust, yaw]);

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
        <canvas ref={canvasRef} width={1000} height={560} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,.36))] pointer-events-none" />
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded bg-black/55 px-2 py-1 font-mono text-[10px] text-slate-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> LIVE / {mode.toUpperCase()}
        </div>
        <div className="absolute right-3 top-3 flex gap-2">
          <button onClick={() => setPaused((value) => !value)} className="rounded-full border border-white/25 bg-slate-900/75 p-2 text-slate-200 hover:bg-slate-700" aria-label="Pause simulation"><Eye className="h-4 w-4" /></button>
          <button onClick={stabilize} className="rounded-full border border-white/25 bg-slate-900/75 p-2 text-slate-200 hover:bg-slate-700" aria-label="Stabilize attitude"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={() => setMessage('SYSTEM MENU READY')} className="rounded-full border border-white/25 bg-slate-900/75 p-2 text-slate-200 hover:bg-slate-700" aria-label="Open system menu"><Menu className="h-4 w-4" /></button>
        </div>
        <div className="absolute left-3 top-14 rounded bg-slate-100/90 px-2 py-1 font-mono text-[10px] leading-4 text-blue-950 shadow-lg">
          <div>ALT <b>{(401 + thrust).toFixed(1)}</b></div>
          <div>ROLL <b>{pitch.toFixed(1)}</b></div>
          <div>PITCH <b>{(12 + yaw * .2).toFixed(1)}</b></div>
          <div>YAW <b>{yaw.toFixed(1)}</b></div>
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
