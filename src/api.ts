import type {
  AgentsResponse,
  MessagesResponse,
  TaskStatusResponse,
  ChatResponse,
} from './types';

const BASE = '/api/v1';
const ACCESS_CODE_KEY = 'ai_worker_access_code';

/** getAccessCode returns the stored access code from localStorage (or empty). */
export function getAccessCode(): string {
  return localStorage.getItem(ACCESS_CODE_KEY) || '';
}

/** setAccessCode stores the access code in localStorage. */
export function setAccessCode(code: string): void {
  localStorage.setItem(ACCESS_CODE_KEY, code);
}

/** clearAccessCode removes the stored access code. */
export function clearAccessCode(): void {
  localStorage.removeItem(ACCESS_CODE_KEY);
}

/** authHeaders returns the headers object with X-Access-Code if available. */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const code = getAccessCode();
  if (code) headers['X-Access-Code'] = code;
  return headers;
}

/** AuthResponse is the response from the /auth endpoint. */
export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/** verifyAccessCode sends the access code to the backend for verification. */
export async function verifyAccessCode(code: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_code: code }),
  });
  return res.json();
}

export async function fetchAgents(): Promise<AgentsResponse> {
  const res = await fetch(`${BASE}/agents`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`fetchAgents: ${res.status}`);
  return res.json();
}

export async function fetchMessages(limit = 100): Promise<MessagesResponse> {
  const res = await fetch(`${BASE}/messages?limit=${limit}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`fetchMessages: ${res.status}`);
  return res.json();
}

export async function fetchTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const res = await fetch(`${BASE}/task/${taskId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`fetchTaskStatus: ${res.status}`);
  return res.json();
}

export async function sendChat(message: string): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`sendChat: ${res.status}`);
  return res.json();
}
