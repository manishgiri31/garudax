import { useEffect, useRef, useState } from 'react';
import { playCheckFail, playCheckPass, playCrewReady } from './sound';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import {
  CHECKPOINTS,
  HATCH_POSITION,
  allPassed,
  allResolved,
  initialStatuses,
  isNear,
  skipUnresolved,
  tapCheck,
  type CheckStatus,
} from './crewTrainingLogic';

// Logical scene size. The canvas scales to the card width.
const W = 360;
const H = 220;
const FLOOR_Y = 172;
const START = 0.04;
const SPEED = 0.16; // scene widths per second

const worldX = (p: number) => 36 + p * 290;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface Props {
  onPass: () => void;
  onExit: () => void;
}

interface DrawState {
  position: number;
  facing: 1 | -1;
  walkPhase: number;
  moving: boolean;
  statuses: CheckStatus[];
  near: number;
  pulse: number;
}

const STATUS_COLOR: Record<CheckStatus, string> = {
  pending: '#22d3ee',
  pass: '#34d399',
  fail: '#f87171',
};

function drawScene(ctx: CanvasRenderingContext2D, d: DrawState) {
  ctx.clearRect(0, 0, W, H);

  // Background and cabin wall
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#050813');
  bg.addColorStop(1, '#0b1326');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#0f1a2e';
  ctx.fillRect(0, 30, W, FLOOR_Y - 30);
  ctx.strokeStyle = 'rgba(148,163,184,0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 30);
    ctx.lineTo(x + 0.5, FLOOR_Y);
    ctx.stroke();
  }

  // Ceiling light strip
  ctx.fillStyle = 'rgba(125,211,252,0.28)';
  ctx.fillRect(20, 22, W - 40, 3);

  // Floor
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, FLOOR_Y, W, 2);

  // Labels
  ctx.fillStyle = 'rgba(148,163,184,0.7)';
  ctx.font = '600 8px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CABIN', 8, 52);

  // Hatch on the right
  const hatchX = worldX(HATCH_POSITION);
  ctx.fillStyle = '#27364f';
  ctx.fillRect(hatchX - 6, 60, 36, FLOOR_Y - 60);
  ctx.strokeStyle = '#475569';
  ctx.strokeRect(hatchX - 6.5, 60.5, 36, FLOOR_Y - 61);
  ctx.fillStyle = 'rgba(14,165,233,0.45)';
  ctx.beginPath();
  ctx.arc(hatchX + 12, 92, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(148,163,184,0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('HATCH', hatchX + 12, 56);

  // Checkpoint stations
  CHECKPOINTS.forEach((c, i) => {
    const x = worldX(c.station);
    const status = d.statuses[i];
    const color = STATUS_COLOR[status];

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 70);
    ctx.lineTo(x, FLOOR_Y);
    ctx.stroke();

    ctx.fillStyle = '#0b1222';
    ctx.beginPath();
    ctx.roundRect(x - 27, 38, 54, 24, 4);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.label, x, 50);

    // Small icon per checkpoint
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    if (c.id === 'seal') {
      ctx.beginPath();
      ctx.arc(x, 57, 3.5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (c.id === 'tether') {
      ctx.beginPath();
      ctx.moveTo(x - 7, 57);
      ctx.lineTo(x + 7, 57);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 7, 57, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x - 4, 54, 8, 6);
    }

    // Result badge at the base of the pole
    if (status === 'pass' || status === 'fail') {
      ctx.beginPath();
      ctx.arc(x, FLOOR_Y - 10, 6, 0, Math.PI * 2);
      ctx.fillStyle = status === 'pass' ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.beginPath();
      if (status === 'pass') {
        ctx.moveTo(x - 3, FLOOR_Y - 10);
        ctx.lineTo(x - 1, FLOOR_Y - 8);
        ctx.lineTo(x + 3, FLOOR_Y - 12);
      } else {
        ctx.moveTo(x - 3, FLOOR_Y - 13);
        ctx.lineTo(x + 3, FLOOR_Y - 7);
        ctx.moveTo(x + 3, FLOOR_Y - 13);
        ctx.lineTo(x - 3, FLOOR_Y - 7);
      }
      ctx.stroke();
    }

    // Pulsing ring when the player is in reach of a pending check
    if (d.near === i) {
      ctx.beginPath();
      ctx.arc(x, FLOOR_Y - 10, 9 + Math.sin(d.pulse) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34,211,238,0.8)';
      ctx.stroke();
    }
  });

  // Astronaut sprite (our own drawing, not a photo)
  drawAstronaut(ctx, worldX(d.position), d.facing, d.moving ? Math.sin(d.walkPhase) * 0.55 : 0);
}

function drawAstronaut(ctx: CanvasRenderingContext2D, x: number, facing: 1 | -1, swing: number) {
  ctx.save();
  ctx.translate(x, FLOOR_Y);
  ctx.scale(facing, 1);

  // Legs
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(-2, -22);
  ctx.lineTo(-2 + swing * 9, -1);
  ctx.moveTo(2, -22);
  ctx.lineTo(2 - swing * 9, -1);
  ctx.stroke();
  // Boots
  ctx.fillStyle = '#475569';
  ctx.fillRect(-4 + swing * 9, -3, 6, 3);
  ctx.fillRect(-2 - swing * 9, -3, 6, 3);

  // Backpack (behind the body)
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.roundRect(-13, -42, 7, 19, 2);
  ctx.fill();

  // Arm
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(3, -37);
  ctx.lineTo(7 - swing * 5, -27);
  ctx.stroke();

  // Torso with orange stripe
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.roundRect(-7, -43, 14, 23, 5);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.fillRect(-7, -31, 14, 3);

  // Helmet and visor
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, -52, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const visor = ctx.createLinearGradient(-2, -58, 8, -46);
  visor.addColorStop(0, '#38bdf8');
  visor.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = visor;
  ctx.beginPath();
  ctx.ellipse(3, -52, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(0, -55, 2, 1.5);

  ctx.restore();
}

export function CrewTrainingScreen({ onPass, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionRef = useRef(START);
  const facingRef = useRef<1 | -1>(1);
  const walkPhaseRef = useRef(0);
  const keysRef = useRef({ left: false, right: false });
  const holdRef = useRef(0);
  const statusesRef = useRef(initialStatuses());

  const [statuses, setStatuses] = useState(initialStatuses);
  const [near, setNear] = useState(-1);
  const [hint, setHint] = useState<string | null>(null);

  const setAll = (next: CheckStatus[]) => {
    statusesRef.current = next;
    setStatuses(next);
  };

  const finished = allResolved(statuses);
  const passed = allPassed(statuses);

  // Keyboard: arrow keys walk while held.
  useEffect(() => {
    const set = (e: KeyboardEvent, value: boolean) => {
      if (e.key === 'ArrowRight') {
        keysRef.current.right = value;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        keysRef.current.left = value;
        e.preventDefault();
      }
    };
    const down = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    const clear = () => {
      keysRef.current = { left: false, right: false };
      holdRef.current = 0;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, []);

  // Keep the canvas crisp at its displayed size.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round((cssW * H) / W * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Game loop: walk, skip at the hatch, find the station in reach, draw.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let pulse = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      pulse += dt * 6;

      const done = allResolved(statusesRef.current);
      let move = 0;
      if (!done) {
        move = clamp((keysRef.current.right ? 1 : 0) - (keysRef.current.left ? 1 : 0) + holdRef.current, -1, 1);
        if (move !== 0) {
          positionRef.current = clamp(positionRef.current + move * SPEED * dt, 0, 1);
          walkPhaseRef.current += dt * 9;
          facingRef.current = move > 0 ? 1 : -1;
        }
        if (positionRef.current >= HATCH_POSITION) {
          const r = skipUnresolved(statusesRef.current);
          statusesRef.current = r.statuses;
          setStatuses(r.statuses);
          if (r.hint) setHint(r.hint);
        }
      }

      let inReach = -1;
      for (let i = 0; i < CHECKPOINTS.length; i++) {
        if (statusesRef.current[i] === 'pending' && isNear(positionRef.current, i)) {
          inReach = i;
          break;
        }
      }
      setNear(inReach);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const s = canvas.width / W;
        ctx.setTransform(s, 0, 0, s, 0, 0);
        drawScene(ctx, {
          position: positionRef.current,
          facing: facingRef.current,
          walkPhase: walkPhaseRef.current,
          moving: move !== 0,
          statuses: statusesRef.current,
          near: inReach,
          pulse,
        });
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const holdHandlers = (dir: -1 | 1) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      holdRef.current = dir;
    },
    onPointerUp: () => (holdRef.current = 0),
    onPointerLeave: () => (holdRef.current = 0),
    onPointerCancel: () => (holdRef.current = 0),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const onCheck = (index: number) => {
    const r = tapCheck(statusesRef.current, index);
    setAll(r.statuses);
    if (r.hint) setHint(r.hint);
    if (r.statuses[index] === 'pass') playCheckPass();
    else if (r.statuses[index] === 'fail') playCheckFail();
  };

  // Result cue, once per finished run.
  useEffect(() => {
    if (!finished) return;
    if (passed) playCrewReady();
    else playCheckFail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const tryAgain = () => {
    positionRef.current = START;
    facingRef.current = 1;
    setAll(initialStatuses());
    setHint(null);
    setNear(-1);
  };

  const nearLabel = near >= 0 ? CHECKPOINTS[near].label : null;

  return (
    <div className="min-h-screen text-white bg-[#02030a] px-4 py-5">
      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase text-cyan-300/80">Stage 0</div>
            <h1 className="text-lg font-bold">Crew training</h1>
          </div>
          <button onClick={onExit} className="text-sm text-slate-400 hover:text-slate-200 px-2 py-1">
            Back
          </button>
        </header>

        <p className="text-sm text-slate-300 mb-3">
          Walk to each station and tap <span className="font-semibold">Check</span>. Do them in order.
        </p>

        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Airlock side view. Walk from the cabin to the hatch and check the suit seal, tether and tools."
          className="w-full rounded-xl border border-cyan-400/20 bg-[#050813] touch-none select-none"
          style={{ aspectRatio: `${W} / ${H}` }}
        />

        {/* Walk controls: arrow keys, or hold a button */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            {...holdHandlers(-1)}
            className="min-h-[52px] rounded-xl border border-slate-600 bg-slate-900/70 text-slate-200 font-semibold flex items-center justify-center gap-2 touch-none select-none active:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" /> Hold to walk left
          </button>
          <button
            {...holdHandlers(1)}
            className="min-h-[52px] rounded-xl border border-slate-600 bg-slate-900/70 text-slate-200 font-semibold flex items-center justify-center gap-2 touch-none select-none active:bg-slate-800"
          >
            Hold to walk right <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => nearLabel !== null && onCheck(near)}
          disabled={nearLabel === null || finished}
          className="mt-3 w-full min-h-[52px] rounded-xl bg-cyan-400 text-slate-950 font-bold disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
        >
          {nearLabel ? `Check: ${nearLabel}` : 'Walk to a station to check it'}
        </button>

        {/* One hint line at a time */}
        <p role="status" className="mt-3 min-h-[1.5rem] text-sm text-amber-200">
          {hint ?? (finished ? '' : 'Walk right to begin. Arrow keys work too.')}
        </p>

        <ul className="mt-2 grid grid-cols-3 gap-2">
          {CHECKPOINTS.map((c, i) => (
            <li
              key={c.id}
              className="rounded-lg bg-slate-900/70 border border-slate-700/60 px-2 py-2 text-center text-xs"
            >
              <div className="text-slate-300">{c.label}</div>
              <div
                className={`mt-1 font-semibold ${
                  statuses[i] === 'pass' ? 'text-emerald-300' : statuses[i] === 'fail' ? 'text-red-300' : 'text-slate-500'
                }`}
              >
                {statuses[i] === 'pass' ? 'Pass' : statuses[i] === 'fail' ? 'Missed' : 'Pending'}
              </div>
            </li>
          ))}
        </ul>

        {finished && (
          <section
            role="dialog"
            aria-label="Crew training result"
            className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/90 p-5 text-center"
          >
            {passed ? (
              <>
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 text-emerald-300" />
                </div>
                <h2 className="text-xl font-bold">Crew ready</h2>
                <p className="text-sm text-slate-300 mt-1 mb-4">All three checks passed. Stage 1 is open.</p>
                <button
                  onClick={onPass}
                  className="w-full min-h-[48px] rounded-xl bg-cyan-400 text-slate-950 font-bold"
                >
                  Go to Stage 1
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                  <X className="w-6 h-6 text-red-300" />
                </div>
                <h2 className="text-xl font-bold">Retrain</h2>
                <p className="text-sm text-slate-300 mt-1 mb-4">
                  Some checks were missed. Walk the airlock again and do them in order.
                </p>
                <button
                  onClick={tryAgain}
                  className="w-full min-h-[48px] rounded-xl border border-cyan-400/60 text-cyan-200 font-bold hover:bg-cyan-400/10"
                >
                  Try again
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
