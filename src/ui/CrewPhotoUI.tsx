import { useRef, useState, type ChangeEvent } from 'react';
import { Rocket } from 'lucide-react';
import {
  removeCrewPhoto,
  resizeToCrewPhoto,
  saveCrewPhoto,
  useCrewPhoto,
  validateCrewPhotoFile,
} from './crewPhoto';

/** The title-card emblem: the crew photo if there is one, otherwise the default mission patch. */
export function CrewPatch({ className = 'w-20 h-20' }: { className?: string }) {
  const photo = useCrewPhoto();
  if (photo) {
    return (
      <img
        src={photo}
        alt="Your crew photo"
        width={256}
        height={256}
        className={`${className} rounded-2xl object-cover mb-4 shadow-lg shadow-cyan-400/30 border border-cyan-400/40`}
      />
    );
  }
  return (
    <div
      className={`inline-flex items-center justify-center ${className} rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-4 shadow-lg shadow-blue-500/30`}
    >
      <Rocket className="w-10 h-10 text-white" />
    </div>
  );
}

/** "Add your photo" file input with preview, error line and "Remove photo". Nothing is uploaded. */
export function CrewPhotoPicker() {
  const photo = useCrewPhoto();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;

    const problem = validateCrewPhotoFile(file);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const dataUrl = await resizeToCrewPhoto(file);
      const saveError = saveCrewPhoto(dataUrl);
      if (saveError) setError(saveError);
    } catch {
      setError('This image could not be read. Try a different file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {photo ? (
          <img src={photo} alt="" width={48} height={48} className="w-12 h-12 rounded-lg object-cover border border-slate-600" />
        ) : (
          <div className="w-12 h-12 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-[10px] text-slate-500">
            No photo
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="px-3 py-2 rounded-lg border border-slate-600 text-slate-200 text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {busy ? 'Resizing…' : photo ? 'Change photo' : 'Add your photo'}
          </button>
          {photo && (
            <button
              type="button"
              onClick={() => {
                removeCrewPhoto();
                setError(null);
              }}
              className="px-3 py-2 rounded-lg text-red-300 text-sm hover:bg-red-500/10 transition-colors"
            >
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onChange}
          className="sr-only"
          aria-label="Add your photo"
        />
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      ) : (
        <p className="text-xs text-slate-500">Stays on this device. Max 5 MB. Shown as a 256×256 square.</p>
      )}
    </div>
  );
}
