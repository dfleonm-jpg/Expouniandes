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

// ---- Sistema de dominio adaptativo (fortalezas/debilidades por tema) ----
// Se actualiza con cada actividad (quiz, parcial, práctica) usando una media
// móvil exponencial, de modo que refleja el nivel ACTUAL del estudiante.
export type MasteryTopic = {
  topic: string;        // nombre del tema/materia (clave normalizada)
  label: string;        // nombre legible original
  score: number;        // dominio 0..100 (media móvil)
  attempts: number;     // nº de evaluaciones registradas
  lastUpdated: number;  // epoch ms
  level: "principiante" | "en progreso" | "competente" | "dominado";
};

export type MasteryState = {
  topics: Record<string, MasteryTopic>;
};

// ---- Parcial de respuesta abierta (IP/subnetting, estructuras, etc.) ----
export type OpenExamQuestion = {
  id: string;
  topic: string;
  prompt: string;        // enunciado (markdown/LaTeX)
  type: "numeric" | "short" | "long" | "code"; // formato de respuesta esperado
  expectedAnswer: string; // respuesta/solución de referencia (no se muestra hasta calificar)
  rubric: string;         // criterios de evaluación para la IA
  points: number;         // puntos del ítem
};

export type OpenExam = {
  title: string;
  subject: string;
  questions: OpenExamQuestion[];
};

export type OpenAnswerGrade = {
  questionId: string;
  awarded: number;        // puntos otorgados
  max: number;            // puntos máximos
  correct: boolean;       // ¿correcto en lo esencial?
  feedback: string;       // retroalimentación específica
  modelAnswer: string;    // solución correcta explicada
};

export type OpenExamResult = {
  grades: OpenAnswerGrade[];
  totalAwarded: number;
  totalMax: number;
  score5: number;         // nota 0..5 (escala Uniandes)
  overview: string;       // veredicto general
  weakTopics: string[];   // temas donde falló (para actualizar dominio)
  strongTopics: string[]; // temas donde acertó
};
