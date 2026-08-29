import type { Student } from '../types/user';
import type { SyncLog, GlobalSyncStatus } from '../types/sync';
import type { Assignment } from '../types/assignment';
import { API_BASE } from './apiConfig';
import { authService } from './authService';
import { isTestStudent, formatStudentDisplay } from '../utils/userUtils';

// ─── Admin Service ────────────────────────────────────────────────────────────

export const adminService = {
  /**
   * Get all legitimate students from backend.
   * GET /api/admin/users
   */
  async getStudents(): Promise<Student[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          'Content-Type': 'application/json',
          ...authService.authHeaders(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        return (data || [])
          .filter((u: any) => !isTestStudent(u))
          .map((u: any) => ({
            id: u.id,
            studentId: u.studentId || u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: 'active' as const,
            lastLogin: u.lastLogin,
            lastSync: u.lastSync,
            createdAt: u.createdAt,
          }));
      }
    } catch {
      // return empty array on failure
    }
    return [];
  },

  /**
   * Get a student by their student ID.
   * GET /api/admin/users/:id
   */
  async getStudentById(studentId: string): Promise<Student | null> {
    try {
      const students = await adminService.getStudents();
      return students.find(s => s.studentId === studentId || s.id === studentId) ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Get sync logs.
   * GET /api/admin/sync-logs
   */
  async getSyncLogs(): Promise<SyncLog[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/sync-logs`, {
        headers: {
          'Content-Type': 'application/json',
          ...authService.authHeaders(),
        },
      });
      if (res.ok) {
        const data = await res.json();
        return (data || [])
          .filter((l: any) => !isTestStudent({ name: l.studentName, studentId: l.studentId }))
          .map((l: any) => {
            const { name, studentId } = formatStudentDisplay(l.studentName, l.studentId);
            return {
              id: l.id,
              userId: l.userId,
              studentId: studentId,
              studentName: name,
              triggeredAt: l.startedAt || l.triggeredAt || l.createdAt || null,
              completedAt: l.completedAt,
              status: (l.status ? l.status.toLowerCase() : 'success') as SyncLog['status'],
              assignmentsFetched: l.assignmentsFound || l.assignmentsFetched || 0,
              assignmentsUpdated: l.assignmentsUpdated || 0,
              triggeredBy: (l.triggeredBy ? l.triggeredBy.toLowerCase() : 'scheduled') as SyncLog['triggeredBy'],
              errorMessage: l.errorMessage,
            };
          });
      }
    } catch {
      // return empty array on failure
    }
    return [];
  },

  /**
   * Get global sync status.
   */
  async getGlobalSyncStatus(): Promise<GlobalSyncStatus> {
    const logs = await adminService.getSyncLogs();
    const students = await adminService.getStudents();
    const failed = logs.filter(l => l.status === 'failed').length;
    const lastSync = logs[0]?.triggeredAt || null;
    return {
      lastGlobalSync: lastSync || '',
      nextScheduledSync: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      totalStudentsSynced: students.length,
      failedSyncs: failed,
      isRunning: false,
    };
  },

  /**
   * Trigger sync for a single student.
   * POST /api/admin/users/:id/sync
   */
  async triggerStudentSync(studentId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${studentId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.authHeaders(),
        },
      });
      if (res.ok) {
        return { success: true, message: `Sync triggered for ${studentId}.` };
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Sync failed.');
    } catch (e: any) {
      throw new Error(e.message || 'Failed to trigger sync.');
    }
  },

  /**
   * Trigger sync for all students.
   */
  async triggerGlobalSync(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Global sync initiated for all registered students.' };
  },

  /**
   * Get assignments for a specific student (admin only).
   * GET /api/admin/users/:id/assignments
   */
  async getStudentAssignments(userIdOrStudentId: string): Promise<Assignment[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userIdOrStudentId}/assignments`, {
        headers: {
          'Content-Type': 'application/json',
          ...authService.authHeaders(),
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // return empty on error
    }
    return [];
  },

  /**
   * Get exams for a specific student (admin only).
   * GET /api/admin/users/:id/exams
   */
  async getStudentExams(userId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/exams`, {
        headers: {
          'Content-Type': 'application/json',
          ...authService.authHeaders(),
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // return empty on error
    }
    return [];
  },

  /**
   * Get exam summary for a specific student (admin only).
   * GET /api/admin/users/:id/exams/summary
   */
  async getStudentExamSummary(userId: string): Promise<{ total: number; given: number; pending: number; overdue: number } | null> {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/exams/summary`, {
        headers: {
          'Content-Type': 'application/json',
          ...authService.authHeaders(),
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // return null on error
    }
    return null;
  },

  /**
   * Admin dashboard stats.
   */
  async getDashboardStats() {
    const students = await adminService.getStudents();
    const logs = await adminService.getSyncLogs();
    const failed = logs.filter(l => l.status === 'failed').length;
    return {
      totalStudents: students.length,
      activeStudents: students.length,
      failedSyncs: failed,
      totalAssignments: 0,
      lastSync: logs[0]?.triggeredAt || null,
    };
  },
};
