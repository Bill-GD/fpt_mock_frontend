import { DefaultEventsMap } from '@socket.io/component-emitter';
import { io, type Socket } from 'socket.io-client';
import { normalizeViolationType, RoomIdentificationPayload, type ViolationType } from './types';

const WS_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface ServerToClientEvents {
  room_last_min: (data: never) => void;
  room_time_up: (data: never) => void;
  force_submit: (data: { roomId: number }) => void;
  room_ended: (data: { roomId: number, status: 'FINISHED' }) => void;
  student_join: (data: { id: number, username: string, attemptId: number }) => void;
  room_start: (data: { startTime: Date, endTime: Date, durationMinutes: number }) => void;
  leaderboard: (data: {
    student: { id: number, username: string },
    correctCount: number,
    answeredCount: number,
    totalQuestions: number,
  }) => void;
  student_submit: (data: {
    student: { id: number, username: string },
    correctCount: number,
    totalQuestions: number,
  }) => void;
  log_violation: (data: {
    student: { id: number, username: string },
    id: number,
    violationType: ViolationType,
    timestamp: Date,
  }) => void;
}

export function roomIdentification(code: string, id?: number): RoomIdentificationPayload {
  return { code, id };
}

export function toBackendViolationType(type: string): ViolationType {
  return normalizeViolationType(type);
}

let socket: Socket<ServerToClientEvents, DefaultEventsMap> | null = null;

/**
 * Get or create the singleton Socket.IO connection to the roomws namespace.
 * The cookie (JWT) is sent automatically since we use withCredentials.
 */
export function getSocket(): Socket<ServerToClientEvents, DefaultEventsMap> {
  if (!socket) {
    socket = io(`${WS_URL}/roomws`, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
}

export function leaveQuizSocketRoom(code: string, roomId?: number) {
  const s = getSocket();
  if (s.connected) {
    s.emit('leave', roomIdentification(code, roomId));
  }
}

export type { Socket };
