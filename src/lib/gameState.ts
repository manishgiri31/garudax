import type {
  Badge,
  GameState,
  ModuleId,
  ModuleProgress,
  ModuleStatus,
} from '@/types';

export const MODULES: {
  id: ModuleId;
  name: string;
  tagline: string;
  icon: string;
  maxScore: number;
}[] = [
  {
    id: 'eligibility',
    name: 'Eligibility Screening',
    tagline: 'Confirm you meet astronaut requirements',
    icon: 'ClipboardCheck',
    maxScore: 100,
  },
  {
    id: 'mission',
    name: 'Mission Assignment',
    tagline: 'Choose your path: general or special ops',
    icon: 'Rocket',
    maxScore: 50,
  },
  {
    id: 'knowledge',
    name: 'Space Knowledge',
    tagline: 'Learn about gravity, oxygen & environments',
    icon: 'BookOpen',
    maxScore: 100,
  },
  {
    id: 'cockpit',
    name: '3D Cockpit Academy',
    tagline: 'Fly the console: switches, checklists & emergency drills',
    icon: 'Gauge',
    maxScore: 100,
  },
  {
    id: 'robotics',
    name: 'Robotics & Operations',
    tagline: 'Master spacecraft systems & controls',
    icon: 'Cpu',
    maxScore: 100,
  },
  {
    id: 'physical',
    name: 'Physical Training',
    tagline: 'Spacewalk & mobility in microgravity',
    icon: 'Footprints',
    maxScore: 100,
  },
  {
    id: 'launch',
    name: 'Launch Sequence',
    tagline: 'Execute the pre-flight checklist',
    icon: 'Rocket',
    maxScore: 100,
  },
  {
    id: 'landing',
    name: 'Landing Simulation',
    tagline: 'Pilot the spacecraft to a safe landing',
    icon: 'Plane',
    maxScore: 100,
  },
  {
    id: 'apollo',
    name: 'Apollo Mission Simulator',
    tagline: 'Launch the Saturn V, burn for the Moon and land the Eagle',
    icon: 'Moon',
    maxScore: 100,
  },
  {
    id: 'emergency',
    name: 'Emergency Protocols',
    tagline: 'Handle critical situations & failures',
    icon: 'Siren',
    maxScore: 100,
  },
];

export const ALL_BADGES: Badge[] = [
  {
    id: 'qualified',
    name: 'Cleared for Duty',
    description: 'Passed eligibility screening',
    icon: 'BadgeCheck',
    earned: false,
  },
  {
    id: 'mission_bound',
    name: 'Mission Bound',
    description: 'Received a mission assignment',
    icon: 'Target',
    earned: false,
  },
  {
    id: 'scholar',
    name: 'Space Scholar',
    description: 'Completed all knowledge topics',
    icon: 'GraduationCap',
    earned: false,
  },
  {
    id: 'mechanic',
    name: 'Systems Engineer',
    description: 'Mastered robotics & operations',
    icon: 'Wrench',
    earned: false,
  },
  {
    id: 'spacewalker',
    name: 'Spacewalker',
    description: 'Completed physical training',
    icon: 'Footprints',
    earned: false,
  },
  {
    id: 'launched',
    name: 'We Have Liftoff',
    description: 'Completed a successful launch sequence',
    icon: 'Rocket',
    earned: false,
  },
  {
    id: 'pilot',
    name: 'Ace Pilot',
    description: 'Landed the spacecraft safely',
    icon: 'Plane',
    earned: false,
  },
  {
    id: 'crisis_manager',
    name: 'Crisis Manager',
    description: 'Handled all emergency scenarios',
    icon: 'ShieldAlert',
    earned: false,
  },
  {
    id: 'cockpit_ace',
    name: 'Cockpit Ace',
    description: 'Completed the 3D Cockpit Academy',
    icon: 'Gauge',
    earned: false,
  },
  {
    id: 'apollo_flown',
    name: 'The Eagle Has Landed',
    description: 'Completed the Apollo Mission Simulator',
    icon: 'Moon',
    earned: false,
  },
  {
    id: 'astronaut',
    name: 'Certified Astronaut',
    description: 'Completed all training modules',
    icon: 'Award',
    earned: false,
  },
];

const XP_PER_LEVEL = 200;

export function xpForLevel(level: number): number {
  return (level - 1) * XP_PER_LEVEL;
}

export function levelFromXP(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpProgress(xp: number): { current: number; needed: number; pct: number } {
  const level = levelFromXP(xp);
  const base = xpForLevel(level);
  const current = xp - base;
  const needed = XP_PER_LEVEL;
  return { current, needed, pct: (current / needed) * 100 };
}

export function defaultGameState(): GameState {
  const modules: ModuleProgress[] = MODULES.map((m, idx) => ({
    moduleId: m.id,
    status: (idx === 0 ? 'available' : 'locked') as ModuleStatus,
    score: 0,
    stars: 0,
    completedAt: null,
  }));
  return {
    recruitName: 'Recruit',
    totalXP: 0,
    level: 1,
    modules,
    badges: ALL_BADGES.map((b) => ({ ...b })),
    eligibility: null,
    mission: null,
    currentModule: null,
    startedAt: new Date().toISOString(),
  };
}

export function moduleOrder(): ModuleId[] {
  return MODULES.map((m) => m.id);
}

export function getNextModule(current: ModuleId): ModuleId | null {
  const order = moduleOrder();
  const idx = order.indexOf(current);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

export function unlockNext(state: GameState, completedId: ModuleId): GameState {
  const next = getNextModule(completedId);
  if (!next) return state;
  return {
    ...state,
    modules: state.modules.map((m) =>
      m.moduleId === next && m.status === 'locked'
        ? { ...m, status: 'available' }
        : m
    ),
  };
}

export function getBadgeForModule(moduleId: ModuleId): string | null {
  const map: Partial<Record<ModuleId, string>> = {
    eligibility: 'qualified',
    mission: 'mission_bound',
    knowledge: 'scholar',
    cockpit: 'cockpit_ace',
    robotics: 'mechanic',
    physical: 'spacewalker',
    launch: 'launched',
    landing: 'pilot',
    apollo: 'apollo_flown',
    emergency: 'crisis_manager',
  };
  return map[moduleId] ?? null;
}

/**
 * Brings a saved game up to date with the current module list and badges.
 * Existing progress is kept; modules added in a later release are slotted into
 * their place in the chain, unlocked if their predecessor is already completed.
 */
export function migrateGameState(saved: GameState): GameState {
  const savedById = new Map(saved.modules.map((m) => [m.moduleId, m]));
  const modules: ModuleProgress[] = MODULES.map((def, idx) => {
    const existing = savedById.get(def.id);
    if (existing) return existing;
    const prevId = idx > 0 ? MODULES[idx - 1].id : null;
    const prev = prevId ? savedById.get(prevId) : undefined;
    const unlocked = idx === 0 || prev?.status === 'completed';
    return {
      moduleId: def.id,
      status: (unlocked ? 'available' : 'locked') as ModuleStatus,
      score: 0,
      stars: 0,
      completedAt: null,
    };
  });

  const badgeIds = new Set(saved.badges.map((b) => b.id));
  const badges = [
    ...saved.badges,
    ...ALL_BADGES.filter((b) => !badgeIds.has(b.id)).map((b) => ({ ...b })),
  ];

  return { ...saved, modules, badges };
}

export function checkAllCompleted(state: GameState): boolean {
  return state.modules.every((m) => m.status === 'completed');
}
