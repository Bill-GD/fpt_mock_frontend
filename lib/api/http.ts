import { ApiError } from './api.error';
import {
  AuthUser,
  Exam,
  ExamDetail,
  HistoryItem,
  Question,
  RoomDetail,
  RoomPublicInfo,
  RoomSummary,
  TeacherStats,
  UserRole,
  ViolationDetail,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

/** Generic backend response envelope */
type ApiEnvelope<T> = {
  success: boolean;
  status: number;
  message: string;
  data: T;
  error: string | null;
};

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
) {
  const url = `${BASE}${path}`;
  const init: RequestInit = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  
  const res = await fetch(url, init);
  
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const json = await res.json();
      // NestJS error format: { message, status, error }
      message = Array.isArray(json?.error)
        ? json.error[0]
        : json?.error ?? json?.message ?? message;
    } catch {
    }
    throw new ApiError(res.status, message);
  }
  
  if (res.status === 204) return { success: true, status: 204, message: '', data: undefined as T, error: null };
  return res.json() as Promise<ApiEnvelope<T>>;
}

async function requestForm<T = unknown>(
  method: string,
  path: string,
  formData: FormData,
): Promise<ApiEnvelope<T>> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    credentials: 'include',
    body: formData,
    // No Content-Type — browser sets multipart boundary automatically
  });
  
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const json = await res.json();
      message = Array.isArray(json?.error)
        ? json.error[0]
        : json?.error ?? json?.message ?? message;
    } catch { /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<ApiEnvelope<T>>;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>('GET', path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  postForm: <T = unknown>(path: string, form: FormData) => requestForm<T>('POST', path, form),
};

/* ── Auth ─────────────────────────────────────────────────────────────── */

export async function getMe(): Promise<AuthUser | null> {
  try {
    // Response: { success, status, message, data: { id, email, username, role }, error }
    const envelope = await api.get<{
      id: number; email: string; username: string; role: UserRole;
    }>('/auth/me');
    const d = envelope.data;
    if (!d) return null;
    return {
      id: d.id,
      email: d.email,
      username: d.username,
      role: d.role,
    };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  // Backend sets httpOnly cookie; response data = { token }
  await api.post<{ token: string }>('/auth/login', { email, password });
  // Cookie is now set — fetch user info
  const user = await getMe();
  if (!user) throw new ApiError(401, 'Login thành công nhưng không thể lấy thông tin người dùng');
  return user;
}

export async function register(
  email: string,
  username: string,
  password: string,
  role: 'TEACHER' | 'STUDENT',
): Promise<void> {
  await api.post('/auth/register', { email, username, password, role });
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/* ── Exams ────────────────────────────────────────────────────────────── */

export async function listExams(): Promise<{ exams: Exam[]; total: number }> {
  // Response data: { exams: [...], total: number }
  const envelope = await api.get<{ exams: Exam[]; total: number }>('/exams');
  return envelope.data ?? { exams: [], total: 0 };
}

export async function getExamDetail(id: number): Promise<ExamDetail> {
  // exam service findOne returns Result.ok('Fetched exam', { exam }) → data = { exam: ExamDetail }
  const envelope = await api.get<{ exam: ExamDetail }>(`/exams/${id}`);
  return envelope.data.exam;
}

export async function createExam(body: {
  title: string;
  description?: string;
  durationMinutes: number;
  questions: Array<{
    content: string;
    options: Array<{ content: string; isCorrect: boolean }>;
  }>;
}): Promise<{ id: number }> {
  const envelope = await api.post<{ id: number }>('/exams', body);
  return envelope.data;
}

export async function importExamExcel(examId: number, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  await api.postForm(`/exams/${examId}/import-excel`, form);
}

export async function generateAiQuestions(
  examId: number,
  topic: string,
  difficulty: string,
  quantity: number,
): Promise<void> {
  await api.post(`/exams/${examId}/generate-ai`, { topic, difficulty, quantity });
}

export async function generateAiQuestionsPreview(
  topic: string,
  difficulty: string,
  quantity: number,
) {
  const envelope = await api.post<{
    questions: Question[],
  }>('/exams/generate-ai-preview', { topic, difficulty, quantity });
  return envelope.data;
}

export async function getTeacherStats(): Promise<TeacherStats> {
  try {
    const envelope = await api.get<TeacherStats>('/exams/statistics/overview');
    return envelope.data ?? { totalExams: 0, totalAttempts: 0, totalViolations: 0, violationRate: 0 };
  } catch {
    return { totalExams: 0, totalAttempts: 0, totalViolations: 0, violationRate: 0 };
  }
}

/* ── Rooms ──────────────────────────────x──────────────────────────────── */

export async function getRoomsByExam(examId: number): Promise<RoomSummary[]> {
  try {
    const envelope = await api.get<{ rooms: RoomSummary[]; total: number }>(`/rooms?examId=${examId}`);
    return envelope.data?.rooms ?? [];
  } catch {
    return [];
  }
}

export async function createRoom(examId: number): Promise<{ id: number; code: string }> {
  const envelope = await api.post<{ id: number; code: string }>('/rooms', { examId });
  return envelope.data;
}

export async function openRoom(roomId: number): Promise<void> {
  await api.post(`/rooms/${roomId}/open`);
}

export async function getRoomDetail(roomId: number): Promise<RoomDetail> {
  const envelope = await api.get<RoomDetail>(`/rooms/${roomId}`);
  return envelope.data;
}

export async function getRoomPublicInfo(code: string): Promise<RoomPublicInfo | null> {
  try {
    const envelope = await api.get<RoomPublicInfo>(`/rooms/public/${code}`);
    return envelope.data ?? null;
  } catch {
    return null;
  }
}

/* ── Violations ───────────────────────────────────────────────────────── */

export async function getViolationsByAttempt(attemptId: number): Promise<ViolationDetail[]> {
  try {
    const envelope = await api.get<ViolationDetail[]>(`/violations?attemptId=${attemptId}`);
    const data = envelope.data;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/* ── Student history ──────────────────────────────────────────────────── */

export async function getStudentHistory(
  limit = 10,
  offset = 0,
): Promise<{ history: HistoryItem[]; total: number }> {
  try {
    const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;
    const envelope = await api.get<{ history: HistoryItem[]; total: number }>(
      `/rooms/history?page=${page}&size=${limit}`,
    );
    return envelope.data ?? { history: [], total: 0 };
  } catch {
    return { history: [], total: 0 };
  }
}
