import type { Student, AuthState } from '../types/user';
import { API_BASE } from './apiConfig';
import { getCleanStudentName } from '../utils/userUtils';

const USER_SESSION_KEY = 'klu_user_session';
const AUTH_TOKEN_KEY   = 'klu_auth_token';

/**
 * Helper to check if a JWT token is expired client-side.
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && typeof payload.exp === 'number') {
      // 10s grace window
      return Date.now() >= payload.exp * 1000 - 10000;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Auth Service ──────────────────────────────────────────────────────────────

export const authService = {

  // ── Unified Login ────────────────────────────────────────────────────────────

  /**
   * Authenticate any user (Student or Super Admin) via POST /api/auth/student/login.
   * Role is automatically determined and returned by the backend.
   */
  async login(studentId: string, lmsPassword: string): Promise<Student> {
    const controller = new AbortController();
    // 45s timeout to allow for Render cold starts if the backend was sleeping
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch(`${API_BASE}/auth/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim(), lmsPassword }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = 'Invalid Student ID or password.';
        try {
          const json = await response.json();
          if (json?.message) message = json.message;
        } catch { /* ignore parse errors */ }
        throw new Error(message);
      }

      const data = await response.json();            // { token, type, user }
      authService.persistToken(data.token);          // store JWT in localStorage
      const student = data.user as Student;
      if (student && student.name) {
        student.name = getCleanStudentName(student.name);
      }
      authService.persistUserSession(student);
      try {
        sessionStorage.setItem('klu_pending_auto_sync', 'true');
      } catch {
        // ignore storage errors
      }
      return student;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        throw new Error('Connection timed out. The server may be waking up from sleep. Please try again.');
      }
      if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Unable to connect to the backend server. The server may be waking up or offline. Please retry in a few seconds.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  /** Alias for login for backwards compatibility */
  async studentLogin(studentId: string, lmsPassword: string): Promise<Student> {
    return authService.login(studentId, lmsPassword);
  },

  // ── Logout ───────────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('klu_student_session');
    localStorage.removeItem('klu_admin_session');
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem('klu_student_session');
    sessionStorage.removeItem('klu_admin_session');
    try {
      sessionStorage.removeItem('klu_pending_auto_sync');
    } catch {}
  },

  // ── Token helpers ────────────────────────────────────────────────────────────

  /** Store the JWT token in persistent localStorage. */
  persistToken(token: string) {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to persist token to localStorage', e);
    }
  },

  /**
   * Get the JWT token for use in Authorization headers.
   * Returns null if the user is not logged in or token is expired.
   */
  getToken(): string | null {
    try {
      let token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          localStorage.setItem(AUTH_TOKEN_KEY, token);
          sessionStorage.removeItem(AUTH_TOKEN_KEY);
        }
      }
      if (token && isTokenExpired(token)) {
        authService.logout();
        return null;
      }
      return token;
    } catch {
      return null;
    }
  },

  /**
   * Build an Authorization header object for authenticated API calls.
   * Usage: fetch('/api/me', { headers: authService.authHeaders() })
   */
  authHeaders(): HeadersInit {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // ── Session persistence ──────────────────────────────────────────────────────

  persistUserSession(user: Student) {
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      sessionStorage.removeItem(USER_SESSION_KEY);
    } catch (e) {
      console.warn('Failed to persist user session to localStorage', e);
    }
  },

  persistStudentSession(student: Student) {
    authService.persistUserSession(student);
  },

  /**
   * Synchronously get the stored session from localStorage on app boot / refresh.
   */
  getStoredSession(): AuthState {
    const token = authService.getToken();
    if (!token) {
      return { isAuthenticated: false, user: null, role: null };
    }

    try {
      let rawData = localStorage.getItem(USER_SESSION_KEY);
      if (!rawData) {
        rawData = sessionStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem('klu_student_session');
        if (rawData) {
          localStorage.setItem(USER_SESSION_KEY, rawData);
          sessionStorage.removeItem(USER_SESSION_KEY);
        }
      }

      if (rawData) {
        const student = JSON.parse(rawData) as Student;
        if (student && student.name) {
          student.name = getCleanStudentName(student.name);
        }
        const role = (student.role?.toLowerCase() === 'admin' || student.studentId === '2500032102') ? 'admin' : 'student';
        return { isAuthenticated: true, user: student, role };
      }
    } catch {
      authService.logout();
    }
    return { isAuthenticated: false, user: null, role: null };
  },

  /**
   * Validate the stored JWT session against the backend (/api/me) on app startup.
   * - If valid, refreshes stored user profile and returns active AuthState.
   * - If 401/403 (expired/revoked), clears storage and returns unauthenticated state.
   * - If server is waking up or network is temporarily offline, preserves existing cached session.
   */
  async validateCurrentSession(): Promise<AuthState> {
    const token = authService.getToken();
    if (!token) {
      return { isAuthenticated: false, user: null, role: null };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${API_BASE}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authService.authHeaders(),
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const serverUser = (await response.json()) as Student;
        if (serverUser && serverUser.name) {
          serverUser.name = getCleanStudentName(serverUser.name);
        }
        authService.persistUserSession(serverUser);
        const role = (serverUser.role?.toLowerCase() === 'admin' || serverUser.studentId === '2500032102') ? 'admin' : 'student';
        return { isAuthenticated: true, user: serverUser, role };
      } else if (response.status === 401 || response.status === 403) {
        // Token is rejected by backend (expired or invalid)
        await authService.logout();
        return { isAuthenticated: false, user: null, role: null };
      }
    } catch (err) {
      // Network glitch or server cold start: if token is not expired client-side, keep current session
      console.warn('Background token validation against /api/me deferred due to network/cold-start; maintaining valid stored session.', err);
    }

    return authService.getStoredSession();
  },
};
