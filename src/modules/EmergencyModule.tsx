import { useState } from 'react';
import { Siren, AlertTriangle, CheckCircle2, XCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { ModuleShell, ResultScreen } from '@/components/ModuleShell';
import { SpaceFlightViewport } from '@/components/SpaceFlightViewport';
import { OptionButton } from '@/components/ModuleShell';
import { EMERGENCY_SCENARIOS } from '@/lib/trainingData';
import type { GameState, EmergencyScenario } from '@/types';

interface EmergencyModuleProps {
  state: GameState;
  onComplete: (score: number, stars: number, xp: number) => void;
  onExit: () => void;
}

export function EmergencyModule({ onComplete, onExit }: EmergencyModuleProps) {
  const [phase, setPhase] = useState<'intro' | 'scenario' | 'feedback' | 'result'>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [answered, setAnswered] = useState(false);

  const scenario: EmergencyScenario | null = EMERGENCY_SCENARIOS[currentIdx] ?? null;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
    const option = scenario!.options[idx];
    if (option.correct) {
      setCorrectCount((c) => c + 1);
      setTotalXP((xp) => xp + scenario!.xpReward);
    }
    setPhase('feedback');
  };

  const handleNext = () => {
    if (currentIdx + 1 >= EMERGENCY_SCENARIOS.length) {
      const score = Math.round((correctCount / EMERGENCY_SCENARIOS.length) * 100);
      const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
      setPhase('result');
      onComplete(score, stars, totalXP);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setAnswered(false);
      setPhase('scenario');
    }
  };

  if (phase === 'result') {
    const score = Math.round((correctCount / EMERGENCY_SCENARIOS.length) * 100);
    const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
    return (
      <ModuleShell
        title="Emergency Protocols"
        subtitle="Crisis response training complete"
        icon={<Siren className="w-7 h-7" />}
        onExit={onExit}
      >
        <ResultScreen
          score={score}
          stars={stars}
          xpGained={totalXP}
          message={`You handled ${correctCount} of ${EMERGENCY_SCENARIOS.length} emergency scenarios correctly. ${score >= 90 ? 'Exceptional crisis management!' : score >= 70 ? 'Solid emergency response skills.' : 'Review the protocols — lives depend on quick correct action.'}`}
          onContinue={onExit}
          onRetry={() => {
            setCurrentIdx(0);
            setCorrectCount(0);
            setTotalXP(0);
            setSelectedOption(null);
            setAnswered(false);
            setPhase('scenario');
          }}
        />
      </ModuleShell>
    );
  }

  if (phase === 'intro') {
    return (
      <ModuleShell
        title="Emergency Protocols"
        subtitle="Handle critical in-flight situations"
        icon={<Siren className="w-7 h-7" />}
        onExit={onExit}
      >
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-red-500/10 to-orange-400/5 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Crisis Management Training</h3>
                <p className="text-slate-300 leading-relaxed">
                  In space, emergencies can be life-threatening within minutes. You'll face {EMERGENCY_SCENARIOS.length} critical scenarios. For each, choose the best response from the options. Correct decisions earn XP — wrong ones show you the right approach.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Scenarios you'll face:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EMERGENCY_SCENARIOS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 p-2.5 bg-slate-800/40 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-sm text-slate-300">{s.title}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase('scenario')}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all"
          >
            Begin Emergency Training
          </button>
        </div>
      </ModuleShell>
    );
  }

  if (!scenario) return null;

  const selectedOptionData = selectedOption !== null ? scenario.options[selectedOption] : null;

  return (
    <ModuleShell
      title="Emergency Protocols"
      subtitle={`Scenario ${currentIdx + 1} of ${EMERGENCY_SCENARIOS.length}`}
      icon={<Siren className="w-7 h-7" />}
      onExit={onExit}
    >
      <div className="space-y-5">
        <SpaceFlightViewport mode="systems" />
        {/* Progress */}
        <div className="flex items-center gap-2">
          {EMERGENCY_SCENARIOS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < currentIdx ? 'bg-emerald-500' : i === currentIdx ? 'bg-red-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Scenario card */}
        <div className="bg-gradient-to-br from-red-500/10 to-orange-400/5 border border-red-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Critical Alert</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-3">{scenario.title}</h3>
          <p className="text-slate-300 leading-relaxed mb-4">{scenario.description}</p>

          <div className="bg-slate-900/60 rounded-xl p-3">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Detected Symptoms:</div>
            <div className="flex flex-wrap gap-2">
              {scenario.symptoms.map((sym, i) => (
                <span key={i} className="text-xs bg-red-500/15 text-red-300 px-2.5 py-1 rounded-full">
                  {sym}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="text-sm text-slate-400 font-medium">Select your response:</div>
          {scenario.options.map((opt, i) => (
            <OptionButton
              key={i}
              onClick={() => handleSelect(i)}
              selected={selectedOption === i}
              correct={answered && opt.correct}
              wrong={answered && selectedOption === i && !opt.correct}
              disabled={answered}
            >
              {opt.text}
            </OptionButton>
          ))}
        </div>

        {/* Feedback */}
        {phase === 'feedback' && selectedOptionData && (
          <div className="animate-[fadeIn_0.3s_ease] space-y-4">
            <div className={`flex items-start gap-3 p-4 rounded-xl ${
              selectedOptionData.correct
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-amber-500/10 border border-amber-500/30'
            }`}>
              {selectedOptionData.correct ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className={`text-sm font-bold mb-1 ${
                  selectedOptionData.correct ? 'text-emerald-300' : 'text-amber-300'
                }`}>
                  {selectedOptionData.correct ? `Correct! +${scenario.xpReward} XP` : 'Incorrect'}
                </div>
                <p className="text-sm text-slate-300">{selectedOptionData.feedback}</p>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              {currentIdx + 1 >= EMERGENCY_SCENARIOS.length ? 'Finish Training' : 'Next Scenario'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </ModuleShell>
  );
}
