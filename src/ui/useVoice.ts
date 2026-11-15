import { useCallback, useEffect, useState } from 'react';
import {
  cancelSpeech,
  isVoiceSupported,
  loadVoiceEnabled,
  saveVoiceEnabled,
  speakLine,
} from './voice';

export function useVoice() {
  const supported = isVoiceSupported();
  const [enabled, setEnabled] = useState<boolean>(() => supported && loadVoiceEnabled());

  // Stop speaking if the tab is hidden, so nothing plays in the background.
  useEffect(() => {
    if (!supported) return;
    const onVisibility = () => {
      if (document.hidden) cancelSpeech();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [supported]);

  const toggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    saveVoiceEnabled(next);
    if (!next) cancelSpeech();
  }, [enabled]);

  const speak = useCallback((text: string) => speakLine(text, enabled), [enabled]);

  return { supported, enabled, toggle, speak };
}
