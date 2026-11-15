import { useCallback, useEffect, useState } from 'react';
import {
  isSoundSupported,
  loadSoundEnabled,
  playBeep,
  saveSoundEnabled,
  stopAllSound,
  unlockAudioFromTap,
} from './sound';

export function useSound() {
  const supported = isSoundSupported();
  const [enabled, setEnabled] = useState<boolean>(() => supported && loadSoundEnabled());

  // While sound is on: the first real tap unlocks audio, and button presses beep.
  useEffect(() => {
    if (!supported || !enabled) return;
    const onPointerDown = (e: PointerEvent) => {
      unlockAudioFromTap();
      const target = e.target as Element | null;
      if (target?.closest?.('button')) playBeep();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [supported, enabled]);

  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    saveSoundEnabled(next);
    if (next) {
      // This click is a user gesture, so the AudioContext may start here.
      unlockAudioFromTap();
    } else {
      stopAllSound();
    }
  }, [enabled]);

  return { supported, enabled, toggle };
}
