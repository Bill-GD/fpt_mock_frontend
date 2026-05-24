import { io, type Socket } from 'socket.io-client';
import { normalizeViolationType, RoomIdentificationPayload, type ViolationType } from './types';

const WS_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export function roomIdentification(code: string, id?: number): RoomIdentificationPayload {
  return { code, id };
}

export function toBackendViolationType(type: string): ViolationType {
  return normalizeViolationType(type);
}

let socket: Socket | null = null;

/**
 * Get or create the singleton Socket.IO connection to the roomws namespace.
 * The cookie (JWT) is sent automatically since we use withCredentials.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${WS_URL}/roomws`, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function connectSocket(): Socket {
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
