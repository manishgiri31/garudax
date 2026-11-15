import type { GameState, ModuleId } from '@/types';
import { getBadgeForModule, unlockNext, checkAllCompleted } from '@/lib/gameState';

export function completeModule(
  state: GameState,
  moduleId: ModuleId,
  score: number,
  stars: number,
  xpGained: number
): GameState {
  let newState: GameState = {
    ...state,
    totalXP: state.totalXP + xpGained,
    modules: state.modules.map((m) =>
      m.moduleId === moduleId
        ? {
            ...m,
            status: 'completed',
            score: Math.max(m.score, score),
            stars: Math.max(m.stars, stars),
            completedAt: new Date().toISOString(),
          }
        : m
    ),
  };

  // Reassign level based on totalXP — handled by levelFromXP at render time
  // but store it for convenience
  newState = unlockNext(newState, moduleId);

  // Award badge
  const badgeId = getBadgeForModule(moduleId);
  if (badgeId) {
    newState = {
      ...newState,
      badges: newState.badges.map((b) =>
        b.id === badgeId ? { ...b, earned: true } : b
      ),
    };
  }

  // Check for the ultimate badge
  if (checkAllCompleted(newState)) {
    newState = {
      ...newState,
      badges: newState.badges.map((b) =>
        b.id === 'astronaut' ? { ...b, earned: true } : b
      ),
    };
  }

  return newState;
}

export function setInProgress(
  state: GameState,
  moduleId: ModuleId
): GameState {
  return {
    ...state,
    currentModule: moduleId,
    modules: state.modules.map((m) =>
      m.moduleId === moduleId && m.status !== 'completed'
        ? { ...m, status: 'in-progress' }
        : m
    ),
  };
}
