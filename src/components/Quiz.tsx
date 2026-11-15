import { useState, useCallback } from 'react';
import { CheckCircle2, XCircle, ArrowRight, BookOpen, Lightbulb } from 'lucide-react';
import { OptionButton } from '@/components/ModuleShell';
import type { QuizQuestion } from '@/types';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export function Quiz({ questions, onComplete }: QuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const question = questions[currentIdx];

  const handleSelect = useCallback(
    (idx: number) => {
      if (answered) return;
      setSelectedIdx(idx);
      setAnswered(true);
      if (idx === question.correctIndex) {
        setCorrectCount((c) => c + 1);
      }
    },
    [answered, question.correctIndex]
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      const score = Math.round((correctCount / questions.length) * 100);
      onComplete(score);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedIdx(null);
      setAnswered(false);
    }
  }, [currentIdx, questions.length, correctCount, onComplete]);

  return (
    <div className="space-y-5">
      {/* Progress dots */}
      <div className="flex items-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < currentIdx
                ? 'bg-emerald-500'
                : i === currentIdx
                  ? 'bg-blue-500'
                  : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">
          Question {currentIdx + 1} of {questions.length}
        </span>
        <span className="text-slate-400">
          Score: <span className="text-white font-bold">{correctCount}</span>/{currentIdx + (answered ? 1 : 0)}
        </span>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <BookOpen className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <h3 className="text-lg font-semibold text-white leading-snug">
            {question.question}
          </h3>
        </div>

        <div className="space-y-3">
          {question.options.map((opt, i) => (
            <OptionButton
              key={i}
              onClick={() => handleSelect(i)}
              selected={selectedIdx === i}
              correct={answered && i === question.correctIndex}
              wrong={answered && i === selectedIdx && i !== question.correctIndex}
              disabled={answered}
            >
              <span className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                  answered && i === question.correctIndex
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : answered && i === selectedIdx && i !== question.correctIndex
                      ? 'border-red-500 bg-red-500/20 text-red-300'
                      : selectedIdx === i
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-slate-600 text-slate-400'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </span>
            </OptionButton>
          ))}
        </div>

        {answered && (
          <div className="mt-5 animate-[fadeIn_0.3s_ease]">
            <div className={`flex items-start gap-3 p-4 rounded-xl ${
              selectedIdx === question.correctIndex
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-amber-500/10 border border-amber-500/30'
            }`}>
              {selectedIdx === question.correctIndex ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className={`text-sm font-bold mb-1 ${
                  selectedIdx === question.correctIndex ? 'text-emerald-300' : 'text-amber-300'
                }`}>
                  {selectedIdx === question.correctIndex ? 'Correct!' : 'Not quite —'}
                </div>
                <div className="flex items-start gap-1.5">
                  <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">{question.explanation}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              {currentIdx + 1 >= questions.length ? 'Finish Quiz' : 'Next Question'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
