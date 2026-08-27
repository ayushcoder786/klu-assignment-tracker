import type { Student } from '../types/user';
import type { SyncLog, GlobalSyncStatus } from '../types/sync';
import {
  mockStudents, mockSyncLogs, mockGlobalSyncStatus, mockAssignments,
} from '../data/mockData';

// ─── Admin Service ────────────────────────────────────────────────────────────
// All functions are async to match future REST API shape.
// Replace mock returns with real fetch() calls when backend is ready.

export const adminService = {
  /**
   * Get all students.
   * Future: GET /api/admin/students
   */
  async getStudents(): Promise<Student[]> {
    await new Promise(r => setTimeout(r, 600));
    return [...mockStudents];
  },

  /**
   * Get a student by their student ID.
   * Future: GET /api/admin/students/:studentId
   */
  async getStudentById(studentId: string): Promise<Student | null> {
    await new Promise(r => setTimeout(r, 400));
    return mockStudents.find(s => s.studentId === studentId) ?? null;
  },

  /**
   * Get sync logs.
   * Future: GET /api/admin/sync-logs
   */
  async getSyncLogs(): Promise<SyncLog[]> {
    await new Promise(r => setTimeout(r, 600));
    return [...mockSyncLogs].sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  },

  /**
   * Get global sync status.
   * Future: GET /api/admin/sync/status
   */
  async getGlobalSyncStatus(): Promise<GlobalSyncStatus> {
    await new Promise(r => setTimeout(r, 400));
    return { ...mockGlobalSyncStatus };
  },

  /**
   * Trigger sync for all students.
   * Future: POST /api/admin/sync/all
   */
  async triggerGlobalSync(): Promise<{ success: boolean; message: string }> {
    await new Promise(r => setTimeout(r, 3000));
    return { success: true, message: 'Global sync initiated for all active students.' };
  },

  /**
   * Trigger sync for a single student.
   * Future: POST /api/admin/sync/:studentId
   */
  async triggerStudentSync(studentId: string): Promise<{ success: boolean; message: string }> {
    await new Promise(r => setTimeout(r, 1500));
    const student = mockStudents.find(s => s.studentId === studentId);
    if (!student) throw new Error('Student not found.');
    return { success: true, message: `Sync triggered for ${student.name}.` };
  },

  /**
   * Admin dashboard stats.
   * Future: GET /api/admin/dashboard
   */
  async getDashboardStats() {
    await new Promise(r => setTimeout(r, 700));
    const active = mockStudents.filter(s => s.status === 'active').length;
    const failed = mockSyncLogs.filter(l => l.status === 'failed').length;
    return {
      totalStudents: mockStudents.length,
      activeStudents: active,
      failedSyncs: failed,
      totalAssignments: mockAssignments.length,
      lastSync: mockGlobalSyncStatus.lastGlobalSync,
    };
  },
};
