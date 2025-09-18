export interface Project {
  id: string;
  name: string;
  location: string;
  description: string;
  engineer: string;
  foreman: string;
  evaluationDate: string;
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
  finalScore?: number;
  logo?: string;
  clientLogo?: string;
}

export interface Answer {
  questionId: string;
  score: number | null; // Agora permite null para N/A
  notes?: string;
  images?: string[];
}

export interface Evaluation {
  projectId: string;
  answers: Answer[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  completedAt?: string;
}

export interface SafetyQuestion {
  id: string;
  category: string;
  question: string;
  weight: number;
}