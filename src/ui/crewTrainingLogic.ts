// Stage 0 "Crew training": rules, checkpoints and storage. No drawing here.

const STORAGE_KEY = 'outpost.crewTrainingPassed';

export type CheckStatus = 'pending' | 'pass' | 'fail';

export interface Checkpoint {
  id: 'seal' | 'tether' | 'tools';
  label: string;
  /** Position along the walk, 0 (cabin) to 1 (hatch). */
  station: number;
  /** The one hint line for this checkpoint. Shown at most once, on a wrong order or a skip. */
  hint: string;
}

export const CHECKPOINTS: Checkpoint[] = [
  {
    id: 'seal',
    label: 'Suit seal',
    station: 0.24,
    hint: 'Seal your suit collar before you leave the cabin.',
  },
  {
    id: 'tether',
    label: 'Tether',
    station: 0.56,
    hint: 'Clip the tether before you open the hatch.',
  },
  {
    id: 'tools',
    label: 'Tools',
    station: 0.82,
    hint: 'Check every tool is tethered before you go outside.',
  },
];

/** Walking this far to the right ends the walk. Any unresolved check is then skipped. */
export const HATCH_POSITION = 0.94;
/** How close to a station the player must be to tap its check. */
export const STATION_REACH = 0.07;

export function initialStatuses(): CheckStatus[] {
  return CHECKPOINTS.map(() => 'pending');
}

export function isResolved(s: CheckStatus): boolean {
  return s !== 'pending';
}

export function allPassed(statuses: CheckStatus[]): boolean {
  return statuses.every((s) => s === 'pass');
}

export function allResolved(statuses: CheckStatus[]): boolean {
  return statuses.every(isResolved);
}

export function isNear(position: number, index: number): boolean {
  return Math.abs(position - CHECKPOINTS[index].station) <= STATION_REACH;
}

/**
 * Result of tapping the check at `index`.
 * - In order (every earlier check has passed): pass.
 * - Out of order (an earlier check is still pending or has failed): fail, with that checkpoint's hint.
 */
export function tapCheck(
  statuses: CheckStatus[],
  index: number
): { statuses: CheckStatus[]; hint: string | null } {
  if (statuses[index] !== 'pending') return { statuses, hint: null };
  const inOrder = statuses.slice(0, index).every((s) => s === 'pass');
  const next = [...statuses];
  next[index] = inOrder ? 'pass' : 'fail';
  return { statuses: next, hint: inOrder ? null : CHECKPOINTS[index].hint };
}

/** Reaching the hatch: every unresolved check is skipped, which fails it and shows its hint. */
export function skipUnresolved(statuses: CheckStatus[]): { statuses: CheckStatus[]; hint: string | null } {
  let lastHint: string | null = null;
  const next = statuses.map((s, i) => {
    if (s !== 'pending') return s;
    lastHint = CHECKPOINTS[i].hint;
    return 'fail' as CheckStatus;
  });
  return { statuses: next, hint: lastHint };
}

export function loadCrewTrainingPassed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveCrewTrainingPassed(passed: boolean): void {
  try {
    if (passed) window.localStorage.setItem(STORAGE_KEY, 'on');
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the pass lasts for this visit only.
  }
}
