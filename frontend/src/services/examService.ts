import type { Exam, ExamSummary } from '../types/exam';
import { authService } from './authService';
import { isPast, parseISO } from 'date-fns';
import { API_BASE } from './apiConfig';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const examService = {
  /**
   * Fetch all E-Exams for the currently authenticated student.
   * GET /api/exams
   */
  async getExams(): Promise<Exam[]> {
    const response = await fetchWithTimeout(`${API_BASE}/exams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.authHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`Failed to fetch exams (HTTP ${response.status})`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Fetch E-Exam summary counts (total, given, pending, overdue) for the currently authenticated student.
   * GET /api/exams/summary
   */
  async getExamSummary(): Promise<ExamSummary> {
    const response = await fetchWithTimeout(`${API_BASE}/exams/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.authHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(`Failed to fetch exam summary (HTTP ${response.status})`);
    }

    return await response.json();
  },

  /**
   * Fetch a single E-Exam by its database ID.
   * GET /api/exams/:id
   */
  async getExamById(id: string): Promise<Exam | null> {
    const response = await fetchWithTimeout(`${API_BASE}/exams/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authService.authHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to load exam (HTTP ${response.status})`);
    }

    return await response.json();
  },

  /**
   * Calculate summary statistics from a list of exams.
   */
  calculateSummary(exams: Exam[]): ExamSummary {
    const totals: ExamSummary = {
      total: exams.length,
      given: 0,
      pending: 0,
      overdue: 0,
    };

    for (const exam of exams) {
      const status = (exam.status || 'PENDING').toLowerCase();

      if (status === 'given' || status === 'completed') {
        totals.given++;
        continue;
      }

      if (status === 'overdue') {
        totals.overdue++;
        continue;
      }

      // Check if closeDate has passed
      if (exam.closeDate) {
        const close = typeof exam.closeDate === 'string' ? parseISO(exam.closeDate) : new Date(exam.closeDate);
        if (isPast(close)) {
          totals.overdue++;
          continue;
        }
      }

      totals.pending++;
    }

    return totals;
  },
};
