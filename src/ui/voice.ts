// Optional spoken lines via the browser's built-in speechSynthesis.
// No network calls, no API keys, no dependencies.

const STORAGE_KEY = 'outpost.voice';

export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const synth: SpeechSynthesis | undefined = window.speechSynthesis;
  return (
    typeof synth?.speak === 'function' &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

export function loadVoiceEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveVoiceEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Storage blocked or full: the toggle still works for this visit.
  }
}

export function cancelSpeech(): void {
  if (!isVoiceSupported()) return;
  window.speechSynthesis.cancel();
}

/** Speaks one line. Cancels anything still playing so lines never overlap. */
export function speakLine(text: string, enabled: boolean): void {
  if (!enabled || !isVoiceSupported()) return;
  if (document.hidden) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  synth.speak(utterance);
}
