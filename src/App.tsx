import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { completeModule } from '@/lib/progressEngine';
import { Dashboard } from '@/components/Dashboard';
import { EligibilityModule } from '@/modules/EligibilityModule';
import { MissionModule } from '@/modules/MissionModule';
import { KnowledgeModule } from '@/modules/KnowledgeModule';
import { RoboticsModule } from '@/modules/RoboticsModule';
import { PhysicalModule } from '@/modules/PhysicalModule';
import { LaunchModule } from '@/modules/LaunchModule';
import { LandingModule } from '@/modules/LandingModule';
import { EmergencyModule } from '@/modules/EmergencyModule';
import type { ModuleId, EligibilityData, MissionType } from '@/types';

function App() {
  const game = useGameState();
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);

  const exit = () => setActiveModule(null);

  const completeEligibility = (score: number, stars: number, xp: number, data: EligibilityData) => {
    game.updateState((prev) => ({
      ...prev,
      eligibility: data,
    }));
    handleComplete('eligibility', score, stars, xp);
  };

  const completeMission = (score: number, stars: number, xp: number, mission: MissionType) => {
    game.updateState((prev) => ({
      ...prev,
      mission,
    }));
    handleComplete('mission', score, stars, xp);
  };

  const handleComplete = (moduleId: ModuleId, score: number, stars: number, xp: number) => {
    game.updateState((prev) => completeModule(prev, moduleId, score, stars, xp));
    setActiveModule(null);
  };

  switch (activeModule) {
    case 'eligibility':
      return (
        <EligibilityModule
          state={game.state}
          onComplete={completeEligibility}
          onExit={exit}
        />
      );
    case 'mission':
      return (
        <MissionModule
          state={game.state}
          onComplete={completeMission}
          onExit={exit}
        />
      );
    case 'knowledge':
      return (
        <KnowledgeModule
          state={game.state}
          onComplete={(s, st, xp) => handleComplete('knowledge', s, st, xp)}
          onExit={exit}
        />
      );
    case 'robotics':
      return (
        <RoboticsModule
          state={game.state}
          onComplete={(s, st, xp) => handleComplete('robotics', s, st, xp)}
          onExit={exit}
        />
      );
    case 'physical':
      return (
        <PhysicalModule
          state={game.state}
          onComplete={(s, st, xp) => handleComplete('physical', s, st, xp)}
          onExit={exit}
        />
      );
    case 'launch':
      return (
        <LaunchModule
          state={game.state}
          onComplete={(s, st, xp) => handleComplete('launch', s, st, xp)}
          onExit={exit}
        />
      );
    case 'landing':
      return (
        <LandingModule
          state={game.state}
          onComplete={(s, st, xp) => handleComplete('landing', s, st, xp)}
          onExit={exit}
        />
      );
    case 'emergency':
      return (
        <EmergencyModule
          state={game.state}
          onComplete={(s, st, xp) => handleComplete('emergency', s, st, xp)}
          onExit={exit}
        />
      );
    default:
      return (
        <Dashboard
          game={game}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
        />
      );
  }
}

export default App;
