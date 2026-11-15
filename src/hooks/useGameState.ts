import { useCallback, useEffect, useState } from 'react';
import type { GameState } from '@/types';
import { defaultGameState, migrateGameState } from '@/lib/gameState';

const STORAGE_KEY = 'astronaut-training-save';

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      // Basic validation
      if (parsed && parsed.modules && parsed.badges) return migrateGameState(parsed);
    }
  } catch {
    // ignore
  }
  return defaultGameState();
}

export function useGameState() {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setState(updater);
  }, []);

  const reset = useCallback(() => {
    setState(defaultGameState());
  }, []);

  return { state, updateState, reset };
}
