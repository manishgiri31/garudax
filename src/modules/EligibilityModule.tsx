import { useState } from 'react';
import { ClipboardCheck, Eye, HeartPulse, Ruler, Languages, Brain, Dumbbell, Shield, RotateCcw } from 'lucide-react';
import { ModuleShell, ResultScreen } from '@/components/ModuleShell';
import { OptionButton } from '@/components/ModuleShell';
import type { GameState, EligibilityData } from '@/types';

interface EligibilityModuleProps {
  state: GameState;
  onComplete: (score: number, stars: number, xp: number, data: EligibilityData) => void;
  onExit: () => void;
}

interface Criterion {
  key: keyof EligibilityData;
  label: string;
  icon: typeof Eye;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  check: (v: number) => { pass: boolean; msg: string };
}

const CRITERIA: Criterion[] = [
  {
    key: 'age',
    label: 'Age',
    icon: Ruler,
    value: 30,
    min: 20,
    max: 60,
    step: 1,
    unit: 'years',
    check: (v) => ({
      pass: v >= 25 && v <= 50,
      msg: v < 25 ? 'Too young — NASA requires age 25+' : v > 50 ? 'Above typical range (25-50)' : 'Ideal age range',
    }),
  },
  {
    key: 'vision',
    label: 'Vision (20/X)',
    icon: Eye,
    value: 20,
    min: 20,
    max: 40,
    step: 1,
    unit: '',
    check: (v) => ({
      pass: v <= 20,
      msg: v <= 20 ? 'Perfect vision' : v <= 25 ? 'Correctable — acceptable with lenses' : 'Below standard — needs correction',
    }),
  },
  {
    key: 'bloodPressureSystolic',
    label: 'Blood Pressure (Systolic)',
    icon: HeartPulse,
    value: 120,
    min: 90,
    max: 160,
    step: 1,
    unit: 'mmHg',
    check: (v) => ({
      pass: v >= 90 && v <= 140,
      msg: v < 90 ? 'Too low' : v > 140 ? 'Elevated — above acceptable range' : 'Healthy range',
    }),
  },
  {
    key: 'bloodPressureDiastolic',
    label: 'Blood Pressure (Diastolic)',
    icon: HeartPulse,
    value: 80,
    min: 50,
    max: 110,
    step: 1,
    unit: 'mmHg',
    check: (v) => ({
      pass: v >= 60 && v <= 90,
      msg: v < 60 ? 'Too low' : v > 90 ? 'Elevated' : 'Healthy range',
    }),
  },
  {
    key: 'heightCm',
    label: 'Height',
    icon: Ruler,
    value: 175,
    min: 150,
    max: 200,
    step: 1,
    unit: 'cm',
    check: (v) => ({
      pass: v >= 157 && v <= 190,
      msg: v < 157 ? 'Below minimum (157cm) for spacesuit fit' : v > 190 ? 'Above maximum (190cm) for cockpit' : 'Fits spacesuit and cockpit constraints',
    }),
  },
  {
    key: 'englishFluency',
    label: 'English Fluency',
    icon: Languages,
    value: 8,
    min: 1,
    max: 10,
    step: 1,
    unit: '/10',
    check: (v) => ({
      pass: v >= 7,
      msg: v >= 7 ? 'Meets requirement (7+)' : 'Below requirement — astronauts need strong English',
    }),
  },
  {
    key: 'stemScore',
    label: 'STEM Proficiency',
    icon: Brain,
    value: 7,
    min: 1,
    max: 10,
    step: 1,
    unit: '/10',
    check: (v) => ({
      pass: v >= 6,
      msg: v >= 6 ? 'Strong STEM foundation' : 'Needs improvement in STEM fields',
    }),
  },
  {
    key: 'fitnessLevel',
    label: 'Physical Fitness',
    icon: Dumbbell,
    value: 7,
    min: 1,
    max: 10,
    step: 1,
    unit: '/10',
    check: (v) => ({
      pass: v >= 6,
      msg: v >= 6 ? 'Meets fitness requirement' : 'Below fitness requirement',
    }),
  },
  {
    key: 'mentalResilience',
    label: 'Mental Resilience',
    icon: Shield,
    value: 7,
    min: 1,
    max: 10,
    step: 1,
    unit: '/10',
    check: (v) => ({
      pass: v >= 6,
      msg: v >= 6 ? 'Good psychological readiness' : 'Needs psychological preparation',
    }),
  },
];

export function EligibilityModule({ onComplete, onExit }: EligibilityModuleProps) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(CRITERIA.map((c) => [c.key, c.value]))
  );
  const [phase, setPhase] = useState<'input' | 'result'>('input');
  const [submitted, setSubmitted] = useState(false);

  const results = CRITERIA.map((c) => ({
    ...c,
    result: c.check(values[c.key]),
  }));
  const passedCount = results.filter((r) => r.result.pass).length;
  const score = Math.round((passedCount / CRITERIA.length) * 100);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;

  const handleChange = (key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setPhase('result');
    const data: EligibilityData = {
      age: values.age,
      vision: values.vision,
      bloodPressureSystolic: values.bloodPressureSystolic,
      bloodPressureDiastolic: values.bloodPressureDiastolic,
      heightCm: values.heightCm,
      englishFluency: values.englishFluency,
      stemScore: values.stemScore,
      fitnessLevel: values.fitnessLevel,
      mentalResilience: values.mentalResilience,
    };
    onComplete(score, stars, Math.round(score * 0.5), data);
  };

  if (phase === 'result') {
    return (
      <ModuleShell
        title="Eligibility Screening"
        subtitle="Medical & aptitude evaluation"
        icon={<ClipboardCheck className="w-7 h-7" />}
        onExit={onExit}
      >
        <div className="space-y-4">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 space-y-3">
            <h3 className="text-lg font-bold text-white mb-4">Screening Results</h3>
            {results.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    r.result.pass
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${r.result.pass ? 'text-emerald-400' : 'text-red-400'}`} />
                  <div className="flex-1">
                    <div className="text-sm text-slate-300">{r.label}</div>
                    <div className={`text-xs ${r.result.pass ? 'text-emerald-300' : 'text-red-300'}`}>
                      {r.result.msg}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-white">
                    {values[r.key]}{r.unit}
                  </div>
                </div>
              );
            })}
          </div>
          <ResultScreen
            score={score}
            stars={stars}
            xpGained={Math.round(score * 0.5)}
            message={
              score >= 70
                ? `Excellent! You passed ${passedCount} of ${CRITERIA.length} criteria. You're cleared to proceed to mission assignment.`
                : `You passed ${passedCount} of ${CRITERIA.length} criteria. You can proceed, but consider improving your weaker areas.`
            }
            onContinue={onExit}
            onRetry={() => { setPhase('input'); setSubmitted(false); }}
          />
        </div>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell
      title="Eligibility Screening"
      subtitle="Set your physical and mental parameters"
      icon={<ClipboardCheck className="w-7 h-7" />}
      onExit={onExit}
    >
      <div className="space-y-5">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200">
          Adjust each parameter to match your real profile. The system evaluates you against NASA-style astronaut requirements. Be honest — this is your training baseline!
        </div>

        {CRITERIA.map((c) => {
          const Icon = c.icon;
          const check = c.check(values[c.key]);
          return (
            <div
              key={c.key}
              className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className="w-5 h-5 text-blue-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{c.label}</div>
                  <div className={`text-xs ${check.pass ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {check.msg}
                  </div>
                </div>
                <div className="text-lg font-bold text-white tabular-nums">
                  {values[c.key]}{c.unit && <span className="text-slate-400 text-sm ml-1">{c.unit}</span>}
                </div>
              </div>
              <input
                type="range"
                min={c.min}
                max={c.max}
                step={c.step}
                value={values[c.key]}
                onChange={(e) => handleChange(c.key, Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          );
        })}

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
        >
          <ClipboardCheck className="w-5 h-5" />
          Submit for Evaluation
        </button>
      </div>
    </ModuleShell>
  );
}
