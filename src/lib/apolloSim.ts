// Apollo Mission Simulator rules — pure functions, no React or canvas.
// Ported from the standalone nasa.html game; the stage physics are unchanged,
// the state machine is explicit so it can be stepped from a render loop.

export type StageIndex = 0 | 1 | 2;

export const STAGE_NAMES = ['THE ROCKET LAUNCH', 'TRANS-LUNAR BURN', 'MOON LANDING'] as const;

export interface SimInput {
  thrust: boolean;
  left: boolean;
  right: boolean;
}

export interface LaunchState {
  kind: 'launch';
  alt: number; // km
  sp: number; // speed in tenths of km/s (reference units)
  fuel: number;
  ang: number; // pitch over, degrees 0..90
  countdown: number; // seconds before the engine is armed
}

export interface TliState {
  kind: 'tli';
  sp: number; // km/s
  fuel: number;
  burning: boolean;
  idle: number; // seconds spent waiting for the burn to start
  px: number; // scenery progress
}

export interface LandingState {
  kind: 'landing';
  alt: number; // m
  vd: number; // descent speed, m/s (positive = falling)
  vx: number; // sideways speed, m/s
  ang: number; // degrees, 0 = upright
  fuel: number;
}

export type SimState = LaunchState | TliState | LandingState;

export interface Outcome {
  win: boolean;
  message: string;
}

export const TLI_IDLE_LIMIT = 15; // seconds before a never-started burn is a failure

export const TARGETS = {
  launchAltitude: 300,
  launchAngle: 70,
  launchAngleTolerance: 8,
  tliMin: 10.8,
  tliMax: 11.2,
  landingDescent: 3,
  landingSideways: 3,
  landingAngle: 12,
} as const;

export function initialState(stage: StageIndex): SimState {
  switch (stage) {
    case 0:
      return { kind: 'launch', alt: 0, sp: 0, fuel: 1000, ang: 0, countdown: 5 };
    case 1:
      return { kind: 'tli', sp: 7.8, fuel: 600, burning: false, idle: 0, px: 0 };
    case 2:
      return { kind: 'landing', alt: 300, vd: 8, vx: 5, ang: -28, fuel: 950 };
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Advance the simulation by dt seconds. Returns the new state and an outcome once the stage ends. */
export function stepStage(
  state: SimState,
  input: SimInput,
  dt: number
): { state: SimState; outcome: Outcome | null } {
  const tilt = (input.right ? 1 : 0) - (input.left ? 1 : 0);

  if (state.kind === 'launch') {
    if (state.countdown > 0) {
      return { state: { ...state, countdown: state.countdown - dt }, outcome: null };
    }
    const ang = clamp(state.ang + tilt * 18 * dt, 0, 90);
    let sp = state.sp;
    let fuel = state.fuel;
    if (input.thrust && fuel > 0) {
      sp += 14 * dt;
      fuel = Math.max(0, fuel - 120 * dt);
    } else {
      sp -= 8 * dt;
    }
    if (state.alt <= 0 && sp < 0) sp = 0;
    const alt = Math.max(0, state.alt + sp * dt);
    const next: LaunchState = { ...state, alt, sp, fuel, ang };

    if (alt >= TARGETS.launchAltitude) {
      const win = Math.abs(ang - TARGETS.launchAngle) <= TARGETS.launchAngleTolerance;
      return {
        state: next,
        outcome: {
          win,
          message: win
            ? `Perfect gravity turn at ${ang.toFixed(0)}°. Stage separation!`
            : `Altitude reached but your angle was ${ang.toFixed(0)}°. Aim for ${TARGETS.launchAngle}°.`,
        },
      };
    }
    if (fuel <= 0 && sp <= 0 && alt > 0) {
      return { state: next, outcome: { win: false, message: 'Out of fuel before reaching 300 km.' } };
    }
    return { state: next, outcome: null };
  }

  if (state.kind === 'tli') {
    let sp = state.sp;
    let fuel = state.fuel;
    let burning = state.burning;
    let idle = state.idle;
    if (input.thrust && fuel > 0) {
      sp += 0.5 * dt;
      fuel = Math.max(0, fuel - 80 * dt);
      burning = true;
    }
    if (!burning) idle += dt;
    const px = state.px + sp * dt * 6;
    const next: TliState = { ...state, sp, fuel, burning, idle, px };

    if (!burning && idle >= TLI_IDLE_LIMIT) {
      return {
        state: next,
        outcome: { win: false, message: 'The burn never started. Hold 🔥 to begin the trans-lunar injection.' },
      };
    }
    if (burning && (!input.thrust || fuel <= 0 || sp > TARGETS.tliMax)) {
      const ok = sp >= TARGETS.tliMin && sp <= TARGETS.tliMax;
      return {
        state: next,
        outcome: {
          win: ok,
          message: ok
            ? 'Perfect burn! You are on course for the Moon.'
            : sp < TARGETS.tliMin
              ? 'Burn too short — you will not reach the Moon.'
              : 'Burn too long — you will overshoot the Moon.',
        },
      };
    }
    return { state: next, outcome: null };
  }

  // Landing
  const ang = clamp(state.ang + tilt * 40 * dt, -90, 90);
  let thrustAccel = 0;
  let fuel = state.fuel;
  if (input.thrust && fuel > 0) {
    thrustAccel = 4.5;
    fuel = Math.max(0, fuel - 60 * dt);
  }
  const a = (ang * Math.PI) / 180;
  const vx = state.vx + Math.sin(a) * thrustAccel * dt;
  const vd = state.vd - (Math.cos(a) * thrustAccel - 1.6) * dt;
  let alt = state.alt - vd * dt;
  const next: LandingState = { ...state, alt, vd, vx, ang, fuel };

  if (alt <= 0) {
    alt = 0;
    const ok =
      vd < TARGETS.landingDescent &&
      Math.abs(vx) < TARGETS.landingSideways &&
      Math.abs(ang) <= TARGETS.landingAngle;
    return {
      state: { ...next, alt },
      outcome: {
        win: ok,
        message: ok
          ? 'The Eagle has landed!'
          : `Crash! Down ${vd.toFixed(1)}, sideways ${vx.toFixed(1)}, angle ${ang.toFixed(0)}°.`,
      },
    };
  }
  return { state: next, outcome: null };
}

/** Rows for the instrument panel. */
export function hudRows(state: SimState): [string, string][] {
  switch (state.kind) {
    case 'launch':
      return [
        ['Altitude', `${state.alt.toFixed(0)} / ${TARGETS.launchAltitude} km`],
        ['Angle', `${state.ang.toFixed(0)}° / ${TARGETS.launchAngle}°`],
        ['Speed', (state.sp / 10).toFixed(1)],
        ['Fuel', state.fuel.toFixed(0)],
      ];
    case 'tli':
      return [
        ['Speed', `${state.sp.toFixed(2)} km/s`],
        ['Target', `${TARGETS.tliMin} – ${TARGETS.tliMax}`],
        ['Fuel', state.fuel.toFixed(0)],
      ];
    case 'landing':
      return [
        ['Altitude', `${Math.max(0, state.alt).toFixed(0)} m`],
        ['Descent', `${state.vd.toFixed(1)} m/s`],
        ['Sideways', `${state.vx.toFixed(1)} m/s`],
        ['Angle', `${state.ang.toFixed(0)}°`],
        ['Fuel', state.fuel.toFixed(0)],
      ];
  }
}

export const MISSION_QUIZ: { q: string; options: string[]; answer: number; why: string }[] = [
  {
    q: 'Which mission first landed humans on the Moon?',
    options: ['Apollo 8', 'Apollo 11', 'Apollo 13'],
    answer: 1,
    why: 'Apollo 11 landed Neil Armstrong and Buzz Aldrin on 20 July 1969.',
  },
  {
    q: 'Which rocket carried the Apollo crews to the Moon?',
    options: ['Saturn V', 'Falcon 9', 'Soyuz'],
    answer: 0,
    why: 'The three-stage Saturn V launched every crewed Apollo Moon mission.',
  },
  {
    q: 'Why do rockets pitch over after lift-off?',
    options: ['To look cool', 'To gain the sideways speed needed for orbit', 'To save fuel on the pad'],
    answer: 1,
    why: 'Orbit is mostly about going sideways fast, not just up.',
  },
  {
    q: 'How strong is gravity on the Moon compared to Earth?',
    options: ['The same', 'About half', 'About one-sixth'],
    answer: 2,
    why: "Moon gravity is roughly 1/6 of Earth's, so landers must brake gently.",
  },
];

export const STAGE_BRIEFS: { title: string; objective: string[]; controls: string }[] = [
  {
    title: 'Launch the Saturn V',
    objective: ['Reach 300 km altitude', `Pitch to ${TARGETS.launchAngle}° (±${TARGETS.launchAngleTolerance}°)`],
    controls: 'Hold 🔥 to climb. Use ⟳ to pitch over. Fuel is limited!',
  },
  {
    title: 'Trans-lunar burn',
    objective: ['Hold 🔥 to speed up', `Release in the green zone (${TARGETS.tliMin}–${TARGETS.tliMax} km/s)`],
    controls: 'Hold 🔥 to burn. Let go once you are in the zone.',
  },
  {
    title: 'Moon landing',
    objective: [
      `Down speed under ${TARGETS.landingDescent} m/s`,
      `Sideways under ${TARGETS.landingSideways} m/s`,
      `Angle within ±${TARGETS.landingAngle}°`,
    ],
    controls: 'Hold 🔥 to thrust. Use ⟲ ⟳ to tilt the lander.',
  },
];

/** Mission score: quiz is worth 40, each stage is worth 20 (10 if it took a retry). */
export function missionScore(quizCorrect: number, stageAttempts: number[]): number {
  const quiz = Math.round((quizCorrect / MISSION_QUIZ.length) * 40);
  const stages = stageAttempts.reduce((sum, attempts) => sum + (attempts <= 1 ? 20 : 10), 0);
  return quiz + stages;
}
