export type ExamId = string;
export type AttemptId = string;

export type ViolationType =
  | "tab_switch"
  | "keyboard_copy"
  | "keyboard_paste"
  | "camera_multiple_faces"
  | "camera_gaze_away"
  | "camera_missing";

export type DemoExam = {
  id: ExamId;
  code: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  questionCount: number;
  createdAt: string;
};

export type DemoQuestion = {
  id: string;
  content: string;
  options: Record<"A" | "B" | "C" | "D", string>;
  correct: "A" | "B" | "C" | "D";
};

export type DemoAttempt = {
  id: AttemptId;
  examId?: ExamId;
  examCode: string;
  examTitle: string;
  studentEmail: string;
  startedAt: string;
  submittedAt?: string;
  status: "in_progress" | "completed" | "terminated";
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  violationCount: number;
};

export type DemoViolation = {
  id: string;
  attemptId: AttemptId;
  studentEmail: string;
  createdAt: string;
  type: ViolationType;
  description: string;
  evidenceUrl?: string;
};

const KEY_EXAMS = "smartquiz.demo.exams.v1";
const KEY_ATTEMPTS = "smartquiz.demo.attempts.v1";
const KEY_VIOLATIONS = "smartquiz.demo.violations.v1";
const KEY_EXAM_QUESTIONS_PREFIX = "smartquiz.demo.examQuestions.v1.";

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  return safeParseJson<T[]>(window.localStorage.getItem(key), []);
}

function writeList<T>(key: string, list: T[]) {
  window.localStorage.setItem(key, JSON.stringify(list));
}

export function listExams(): DemoExam[] {
  return readList<DemoExam>(KEY_EXAMS).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertExam(exam: DemoExam) {
  const list = readList<DemoExam>(KEY_EXAMS);
  const index = list.findIndex((x) => x.id === exam.id);
  if (index >= 0) list[index] = exam;
  else list.push(exam);
  writeList(KEY_EXAMS, list);
}

export function listAttempts(): DemoAttempt[] {
  return readList<DemoAttempt>(KEY_ATTEMPTS).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function addAttempt(attempt: DemoAttempt) {
  const list = readList<DemoAttempt>(KEY_ATTEMPTS);
  list.push(attempt);
  writeList(KEY_ATTEMPTS, list);
}

export function listViolations(): DemoViolation[] {
  return readList<DemoViolation>(KEY_VIOLATIONS).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addViolations(violations: DemoViolation[]) {
  const list = readList<DemoViolation>(KEY_VIOLATIONS);
  list.push(...violations);
  writeList(KEY_VIOLATIONS, list);
}

export function clearDemoData() {
  window.localStorage.removeItem(KEY_EXAMS);
  window.localStorage.removeItem(KEY_ATTEMPTS);
  window.localStorage.removeItem(KEY_VIOLATIONS);
}

export function setExamQuestions(examId: ExamId, questions: DemoQuestion[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${KEY_EXAM_QUESTIONS_PREFIX}${examId}`, JSON.stringify(questions));
}

export function getExamQuestions(examId: ExamId): DemoQuestion[] {
  if (typeof window === "undefined") return [];
  return safeParseJson<DemoQuestion[]>(
    window.localStorage.getItem(`${KEY_EXAM_QUESTIONS_PREFIX}${examId}`),
    [],
  );
}

export function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function generateExamCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

