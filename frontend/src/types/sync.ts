export type SyncStatusType = 'success' | 'failed' | 'running' | 'pending' | 'partial';

export interface SyncLog {
  id: string;
  studentId: string;
  studentName: string;
  triggeredAt: string;
  completedAt: string | null;
  status: SyncStatusType;
  assignmentsFetched: number;
  assignmentsUpdated: number;
  errorMessage?: string;
  triggeredBy: 'manual' | 'scheduled' | 'system';
}

export interface GlobalSyncStatus {
  lastGlobalSync: string | null;
  nextScheduledSync: string | null;
  totalStudentsSynced: number;
  failedSyncs: number;
  isRunning: boolean;
}

export interface StudentSyncStatus {
  studentId: string;
  lastSync: string | null;
  status: SyncStatusType;
  assignmentsCount: number;
}
