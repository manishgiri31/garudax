import type { ReactNode } from 'react';
import { Starfield } from '@/components/Starfield';

interface ModuleShellProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onExit: () => void;
  children: ReactNode;
}

export function ModuleShell({
  title,
  subtitle,
  icon,
  onExit,
  children,
}: ModuleShellProps) {
  return (
    <div className="min-h-screen relative bg-[#02030a] text-white">
      <Starfield density={120} />
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Base
          </button>
        </div>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-slate-400 text-sm">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

interface ResultScreenProps {
  score: number;
  stars: number;
  xpGained: number;
  message: string;
  onContinue: () => void;
  onRetry?: () => void;
}

export function ResultScreen({
  score,
  stars,
  xpGained,
  message,
  onContinue,
  onRetry,
}: ResultScreenProps) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 text-center space-y-6 animate-[fadeIn_0.4s_ease]">
      <div className="flex justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <svg
            key={i}
            className={`w-12 h-12 transition-all duration-500 ${
              i < stars
                ? 'text-yellow-400 fill-yellow-400 scale-100'
                : 'text-slate-700 fill-slate-800 scale-90'
            }`}
            style={{ transitionDelay: `${i * 200}ms` }}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
          </svg>
        ))}
      </div>
      <div>
        <div className="text-4xl font-bold text-white">{score}%</div>
        <div className="text-slate-400 mt-1">Module Score</div>
      </div>
      <p className="text-slate-300 max-w-md mx-auto">{message}</p>
      <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2">
        <span className="text-blue-300 font-bold">+{xpGained} XP</span>
      </div>
      <div className="flex justify-center gap-3 pt-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
          >
            Retry
          </button>
        )}
        <button
          onClick={onContinue}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

interface OptionButtonProps {
  children: ReactNode;
  onClick: () => void;
  selected?: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
}

export function OptionButton({
  children,
  onClick,
  selected,
  correct,
  wrong,
  disabled,
}: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
        correct
          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-100'
          : wrong
            ? 'border-red-500 bg-red-500/15 text-red-100'
            : selected
              ? 'border-blue-500 bg-blue-500/15 text-blue-100'
              : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}
