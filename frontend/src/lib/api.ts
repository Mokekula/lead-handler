import { LogsFilterParams, LogsResponse } from './types';

const TOKEN_KEY = 'access_token';

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_LOGS_URL ?? '';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiClient(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}

export async function login(password: string): Promise<{ access_token: string }> {
  const response = await fetch(`${getApiUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new Error('Invalid password');
  }

  const data: { access_token: string } = await response.json();
  setToken(data.access_token);
  return data;
}

export async function fetchLogs(filters: LogsFilterParams): Promise<LogsResponse> {
  const params = new URLSearchParams();
  params.append('page', filters.page.toString());
  params.append('pageSize', filters.pageSize.toString());

  if (filters.severity) params.append('severity', filters.severity);
  if (filters.context) params.append('context', filters.context);
  if (filters.leadId) params.append('leadId', filters.leadId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);

  const response = await apiClient(`/api/logs?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }

  return response.json();
}

export async function fetchContexts(): Promise<string[]> {
  const response = await apiClient('/api/logs/contexts');

  if (!response.ok) {
    throw new Error('Failed to fetch contexts');
  }

  return response.json();
}
