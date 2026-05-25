/* ── HTTP ─────────────────────────────────────────────────────────────── */

export enum UserRole {
  teacher = 'TEACHER',
  student = 'STUDENT',
}

export enum RoomStatus {
  inactive = 'INACTIVE',
  waiting = 'WAITING',
  active = 'ACTIVE',
  finished = 'FINISHED',
}

export enum ViolationType {
  tabSwitch = 'TAB_SWITCH',
  keyboardCopy = 'KEYBOARD_COPY',
  keyboardPaste = 'KEYBOARD_PASTE',
  cameraMultipleFaces = 'CAMERA_MULTIPLE_FACES',
  cameraGazeAway = 'CAMERA_GAZE_AWAY',
  cameraMissing = 'CAMERA_MISSING',
  other = 'OTHER',
}

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  role: UserRole;
};

export type Exam = {
  id: number;
  title: string;
  description?: string;
  durationMinutes: number;
  createdAt: string;
  questionCount: number;
  roomCount: number;
};

export type Option = {
  id: number;
  content: string;
  isCorrect: boolean;
};

export type Question = {
  id: number;
  content: string;
  options: Option[];
};

export type ExamDetail = {
  id: number;
  title: string;
  description?: string;
  durationMinutes: number;
  createdAt: string;
  questions: Question[];
  rooms: RoomSummary[];
};

export type RoomSummary = {
  id: number;
  code: string;
  status: RoomStatus;
  startedAt?: string;
  attemptCount?: number;
};

export type RoomDetail = {
  id: number;
  code: string;
  status: RoomStatus;
  createdAt: string;
  exam: {
    id: number;
    title: string;
    durationMinutes: number;
    questionCount: number;
  };
  attemptCount: number;
  attempts: AttemptSummary[];
};

export type AttemptSummary = {
  id: number;
  studentId: number;
  username?: string;
  correctCount: number;
  submittedAt?: string;
  answerCount: number;
  violationCount: number;
};

export type RoomPublicInfo = {
  id: number;
  code: string;
  status: RoomStatus;
  createdAt: string;
  examId: number;
  examTitle: string;
  durationMinutes: number;
};

export type HistoryItem = {
  attemptId: number;
  examTitle: string;
  durationMinutes: number;
  roomCode: string;
  correctCount: number;
  submittedAt?: string;
  violationCount: number;
};

export type TeacherStats = {
  totalExams: number;
  totalAttempts: number;
  totalViolations: number;
  violationRate: number;
};

export type ViolationDetail = {
  id: number;
  violationType: ViolationType;
  evidenceUrl: string | null;
  timestamp: string;
};

export const VIOLATION_TYPE_LABELS: Record<ViolationType, string> = {
  [ViolationType.tabSwitch]: 'Chuyển tab khỏi bài thi',
  [ViolationType.keyboardCopy]: 'Copy (Ctrl+C)',
  [ViolationType.keyboardPaste]: 'Paste (Ctrl+V)',
  [ViolationType.cameraMultipleFaces]: 'Nhiều khuôn mặt trong khung hình',
  [ViolationType.cameraGazeAway]: 'Nhìn ra ngoài màn hình',
  [ViolationType.cameraMissing]: 'Không phát hiện khuôn mặt / camera',
  [ViolationType.other]: 'Vi phạm khác',
};

export function normalizeViolationType(type: string): ViolationType {
  const key = type.toUpperCase().replace(/-/g, '_') as ViolationType;
  return key in VIOLATION_TYPE_LABELS ? key : ViolationType.other;
}

export function getViolationLabel(type: string): string {
  return VIOLATION_TYPE_LABELS[normalizeViolationType(type)];
}

/* ── Socket ─────────────────────────────────────────────────────────────── */

export type SocketEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
}

export type ErrorSocketEnvelope = Omit<SocketEnvelope<never>, 'error'> & { error: string };

/** Matches backend RoomIdentificationDto — `code` is always required (8 chars). */
export type RoomIdentificationPayload = {
  code: string;
  id?: number;
};

/** Matches backend StudentAnswerDto */
export type StudentAnswerPayload = {
  roomId: number;
  examId: number;
  questionId: number;
  optionId?: number;
};

/** Matches backend StudentViolationDto */
export type StudentViolationPayload = {
  roomId: number;
  attemptId: number;
  type: ViolationType;
  evidenceUrl?: string;
};
