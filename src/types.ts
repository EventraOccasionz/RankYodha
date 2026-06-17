export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  subject: string;
}

export interface MockTest {
  testId: string;
  title: string;
  category: string; // "UPSC", "SSC", "Banking", "Railways"
  questionsCount: number;
  durationMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: Question[];
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  examCategory: string;
  avatarUrl: string;
  totalTests: number;
  averageAccuracy: number;
  streakDays: number;
  predictedRank: number;
  updatedAt: string;
}

export interface PrivateUserInfo {
  email: string;
  tier: "free" | "premium";
  purchasedSeries?: string[];
  purchasedTestIds?: string[];
  planExpiresAt?: string;
  createdAt: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionIndex: number | null; // null if unattempted
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface UserAttempt {
  attemptId: string;
  userId: string;
  testId: string;
  testTitle: string;
  category: string;
  scoreSecured: number;
  maxScorePossible: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
  percentileSecured?: number;
  takenAt: string;
  answers: UserAnswer[];
}

export interface PrepVideo {
  videoId: string;
  title: string;
  description: string;
  category: string; // UPSC, JEE, NEET, SSC, etc. OR General
  videoUrl: string; // YouTube, MP4 or Vimeo URL
  durationText: string;
  createdAt: string;
}
