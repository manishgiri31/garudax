// Generated sound effects using the Web Audio API. No audio files, no network.
// The AudioContext is created only from a user tap (see unlockAudioFromTap).
// Sound is OFF by default.

const STORAGE_KEY = 'outpost.sound';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

export function isSoundSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const legacy = window as unknown as { webkitAudioContext?: typeof AudioContext };
  return typeof window.AudioContext === 'function' || typeof legacy.webkitAudioContext === 'function';
}

export function loadSoundEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveSoundEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Storage blocked or full: the toggle still works for this visit.
  }
}

/**
 * Creates or resumes the AudioContext. Call ONLY from a real user gesture
 * (pointerdown, click, keydown). Anything else is ignored.
 */
export function unlockAudioFromTap(): void {
  if (!isSoundSupported()) return;
  if (!ctx) {
    const legacy = window as unknown as { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? legacy.webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

/** True only when a context exists and is running. Sound calls no-op otherwise. */
function ready(): boolean {
  return ctx !== null && ctx.state === 'running' && master !== null;
}

function getNoise(): AudioBuffer | null {
  if (!ctx) return null;
  if (!noise) {
    const length = ctx.sampleRate * 2;
    noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      // Brown-ish noise: smoother than white, good for rumble.
      last = (last + (Math.random() * 2 - 1) * 0.08) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return noise;
}

/** Soft short beep, used on button presses. */
export function playBeep(): void {
  if (!ready() || !master) return;
  const t = ctx!.currentTime;
  const osc = ctx!.createOscillator();
  const gain = ctx!.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.12, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.13);
}

/** Rising alarm. Plays a few sweeps, then stops by itself. */
export function playAlarm(): void {
  if (!ready() || !master) return;
  const start = ctx!.currentTime;
  for (let n = 0; n < 3; n++) {
    const t = start + n * 0.7;
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.5);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.03);
    gain.gain.setValueAtTime(0.1, t + 0.5);
    gain.gain.linearRampToValueAtTime(0, t + 0.56);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + 0.6);
  }
}

const activeStops = new Set<() => void>();

/**
 * Low thrust rumble. Returns a stop function. Call it when firing ends.
 * Returns a no-op if sound is not ready.
 */
export function startRumble(): () => void {
  if (!ready() || !master) return () => {};
  const buffer = getNoise();
  if (!buffer) return () => {};
  const t = ctx!.currentTime;

  const src = ctx!.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const lowpass = ctx!.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 110;
  const gain = ctx!.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.35, t + 0.3);
  src.connect(lowpass).connect(gain).connect(master);
  src.start(t);

  let stopped = false;
  const stop = () => {
    if (stopped || !ctx) return;
    stopped = true;
    activeStops.delete(stop);
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    src.stop(now + 0.25);
  };
  activeStops.add(stop);
  return stop;
}

/** Short low thud, used on landing. */
export function playThud(): void {
  if (!ready() || !master) return;
  const t = ctx!.currentTime;

  const osc = ctx!.createOscillator();
  const gain = ctx!.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
  gain.gain.setValueAtTime(0.6, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.42);

  const buffer = getNoise();
  if (buffer) {
    const src = ctx!.createBufferSource();
    src.buffer = buffer;
    const lowpass = ctx!.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 220;
    const ng = ctx!.createGain();
    ng.gain.setValueAtTime(0.3, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    src.connect(lowpass).connect(ng).connect(master);
    src.start(t, 0.1, 0.25);
  }
}

/** Stops any running rumble. Called when sound is switched off. */
export function stopAllSound(): void {
  for (const stop of Array.from(activeStops)) stop();
}
