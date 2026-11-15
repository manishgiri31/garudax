import { useState } from 'react';
import { Rocket, Orbit, Star, Clock, Gauge, Users, Zap } from 'lucide-react';
import { ModuleShell, ResultScreen } from '@/components/ModuleShell';
import { SpaceFlightViewport } from '@/components/SpaceFlightViewport';
import type { GameState, MissionType } from '@/types';

interface MissionModuleProps {
  state: GameState;
  onComplete: (score: number, stars: number, xp: number, mission: MissionType) => void;
  onExit: () => void;
}

const MISSIONS = [
  {
    type: 'general' as MissionType,
    name: 'General Orbital Mission',
    icon: Orbit,
    description:
      'A standard mission to the International Space Station. Focus on scientific research, station maintenance, and crew operations.',
    duration: '6 months',
    difficulty: 2,
    crew: '4-7 members',
    xp: 25,
    color: 'blue',
    tasks: [
      'Conduct scientific experiments',
      'Maintain station systems',
      'Perform routine spacewalks',
      'Coordinate with ground control',
    ],
  },
  {
    type: 'special' as MissionType,
    name: 'Special Deep Space Operation',
    icon: Rocket,
    description:
      'An advanced mission beyond Earth orbit — potentially to the Moon or Mars. Higher risk, higher reward. Requires exceptional performance.',
    duration: '12-18 months',
    difficulty: 3,
    crew: '2-4 members',
    xp: 50,
    color: 'amber',
    tasks: [
      'Deep space navigation',
      'Planetary surface operations',
      'Autonomous decision-making',
      'Extended duration survival',
    ],
  },
];

export function MissionModule({ onComplete, onExit }: MissionModuleProps) {
  const [selected, setSelected] = useState<MissionType | null>(null);
  const [phase, setPhase] = useState<'select' | 'result'>('select');

  const mission = MISSIONS.find((m) => m.type === selected);

  const handleConfirm = () => {
    if (!selected || !mission) return;
    setPhase('result');
    onComplete(mission.difficulty === 3 ? 80 : 60, mission.difficulty, mission.xp, selected);
  };

  if (phase === 'result' && mission) {
    return (
      <ModuleShell
        title="Mission Assignment"
        subtitle="Your training path has been set"
        icon={<Rocket className="w-7 h-7" />}
        onExit={onExit}
      >
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              mission.color === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              <mission.icon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{mission.name}</h3>
              <p className="text-slate-400 text-sm">{mission.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <div className="text-white text-sm font-bold">{mission.duration}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <div className="text-white text-sm font-bold">{mission.crew}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Gauge className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <div className="text-white text-sm font-bold flex items-center justify-center gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <Star key={i} className={`w-3 h-3 ${i < mission.difficulty ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <ResultScreen
          score={mission.difficulty === 3 ? 80 : 60}
          stars={mission.difficulty}
          xpGained={mission.xp}
          message={`Mission assigned: ${mission.name}. Your training will now be tailored for ${mission.duration} of ${mission.type === 'special' ? 'deep space' : 'orbital'} operations.`}
          onContinue={onExit}
        />
      </ModuleShell>
    );
  }

  return (
    <ModuleShell
      title="Mission Assignment"
      subtitle="Choose your training path"
      icon={<Rocket className="w-7 h-7" />}
      onExit={onExit}
    >
      <div className="space-y-4">
        <SpaceFlightViewport mode="transfer" />
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-200">
          Your mission type determines the intensity and focus of your training. Choose wisely — a special operation demands more, but rewards more XP.
        </div>

        {MISSIONS.map((m) => {
          const Icon = m.icon;
          const isSelected = selected === m.type;
          return (
            <button
              key={m.type}
              onClick={() => setSelected(m.type)}
              className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
                isSelected
                  ? m.color === 'amber'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                  m.color === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{m.name}</h3>
                    <div className="flex gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < m.difficulty ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{m.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {m.duration}
                    </span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Users className="w-3 h-3" /> {m.crew}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      m.color === 'amber' ? 'bg-amber-500/15 text-amber-300' : 'bg-blue-500/15 text-blue-300'
                    }`}>
                      <Zap className="w-3 h-3" /> +{m.xp} XP
                    </span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1">
                    {m.tasks.map((t) => (
                      <li key={t} className="flex items-center gap-1.5">
                        <span className={`w-1 h-1 rounded-full ${m.color === 'amber' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}

        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Mission Assignment
        </button>
      </div>
    </ModuleShell>
  );
}
