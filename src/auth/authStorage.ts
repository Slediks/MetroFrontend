import type { AuthResponse } from "../types";

const AUTH_STORAGE_KEY = "metrology_auth";

interface StoredSession extends AuthResponse {}

const parseSession = (raw: string | null): StoredSession | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.token !== "string" || typeof parsed.expiresAt !== "number") {
      return null;
    }

    return { token: parsed.token, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
};

export const authStorage = {
  getSession(): StoredSession | null {
    return parseSession(window.localStorage.getItem(AUTH_STORAGE_KEY));
  },

  saveSession(session: StoredSession): void {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  },

  clearSession(): void {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  isExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt;
  }
};
