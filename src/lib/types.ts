// Tipos compartidos de dominio para toda la app.

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type Flashcard = {
  front: string;
  back: string;
};

export type StudyPlanDay = {
  day: string;
  focus: string;
  sessions: { time: string; task: string; durationMin: number }[];
  tip: string;
};

export type StudyPlan = {
  summary: string;
  days: StudyPlanDay[];
};

export type SummaryResult = {
  title: string;
  tldr: string;
  keyPoints: string[];
  concepts: { term: string; definition: string }[];
};

export type Difficulty = "easy" | "medium" | "hard";
