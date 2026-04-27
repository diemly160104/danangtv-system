import type { SessionUser } from "@/features/danangtv/types";

const SESSION_USER_KEY = "danangtv_session_user";

export function saveStoredSessionUser(user: SessionUser | null) {
  if (!user) {
    sessionStorage.removeItem(SESSION_USER_KEY);
    return;
  }

  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function getStoredSessionUser(): SessionUser | null {
  const raw = sessionStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearStoredSessionUser() {
  sessionStorage.removeItem(SESSION_USER_KEY);
}