export type ModuleId =
  | 'eligibility'
  | 'mission'
  | 'knowledge'
  | 'cockpit'
  | 'robotics'
  | 'physical'
  | 'launch'
  | 'landing'
  | 'apollo'
  | 'emergency';

export type ModuleStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export interface ModuleProgress {
  moduleId: ModuleId;
  status: ModuleStatus;
  score: number;
  stars: number; // 0-3
  completedAt: string | null;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}

export interface EligibilityData {
  age: number;
  vision: number; // 20/20 scale, 20 is perfect
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heightCm: number;
  englishFluency: number; // 1-10
  stemScore: number; // 1-10
  fitnessLevel: number; // 1-10
  mentalResilience: number; // 1-10
}

export type MissionType = 'general' | 'special';

export interface GameState {
  recruitName: string;
  totalXP: number;
  level: number;
  modules: ModuleProgress[];
  badges: Badge[];
  eligibility: EligibilityData | null;
  mission: MissionType | null;
  currentModule: ModuleId | null;
  startedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export interface EmergencyScenario {
  id: string;
  title: string;
  description: string;
  symptoms: string[];
  options: {
    text: string;
    correct: boolean;
    feedback: string;
  }[];
  xpReward: number;
}

export interface KnowledgeTopic {
  id: string;
  title: string;
  icon: string;
  summary: string;
  facts: string[];
  questions: QuizQuestion[];
}
