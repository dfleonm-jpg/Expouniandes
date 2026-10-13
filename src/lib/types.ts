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

export type MindMapItem = { text: string; detail?: string };

export type MindMapBranch = {
  emoji?: string;
  label: string;
  items: MindMapItem[];
};

export type MindMap = {
  central: string;
  summary?: string;
  branches: MindMapBranch[];
};

export type CodeExercise = {
  title: string;
  statement: string;
  functionSignature: string;
  hints: string[];
};

export type CodeReview = {
  correct: boolean;
  respectsRestrictions: boolean;
  score: number;
  summary: string;
  errors: { line: string; problem: string; why: string; fix: string }[];
  improvements: string[];
  avoidNextTime: string[];
  complexity: string;
};

export type MathProblem = { title: string; problem: string; answer: string };

export type MathReview = {
  correct: boolean;
  score: number;
  summary: string;
  mistakeStep: string;
  feedback: string;
  solution: string;
};

export type DiagnosticQuestion = {
  area: string;
  question: string;
  options: string[];
  correctIndex: number;
};

export type ExamAnalysis = {
  overview: string;
  weakTopics: { topic: string; accuracy: number; advice: string }[];
  strongTopics: string[];
  trend: string;
  patterns: string[];
  nextSteps: string[];
};
