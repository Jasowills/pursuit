/**
 * Mobile API client — same REST contract as the web dashboard.
 * Dev sessions only in this milestone; on native the token lives in the
 * device secure store (expo-secure-store). The Expo web preview target has
 * no SecureStore and falls back to localStorage (dev preview only).
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'pursuit_dev_token';

function webStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * EXPO_PUBLIC_API_URL must be reachable from the device/simulator. On a
 * physical device use your machine's LAN IP (see README).
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/api/v1';

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') return webStorage()?.getItem(TOKEN_KEY) ?? null;
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage()?.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage()?.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { error?: string; [k: string]: unknown },
  ) {
    super(String(body?.error ?? `HTTP ${status}`));
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface LoginResponse {
  token: string;
  user: { id: string; email: string; display_name: string };
  tenant_id: string;
}
