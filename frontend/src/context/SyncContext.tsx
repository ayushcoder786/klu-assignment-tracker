import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { assignmentService } from '../services/assignmentService';
import { authService } from '../services/authService';
import { useAuth } from './AuthContext';

interface SyncContextValue {
  syncing: boolean;
  lastSyncMessage: string | null;
  lastSyncError: string | null;
  refreshKey: number;
  triggerSync: () => Promise<void>;
  clearSyncMessage: () => void;
  clearSyncError: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { authState } = useAuth();

  const clearSyncMessage = useCallback(() => setLastSyncMessage(null), []);
  const clearSyncError = useCallback(() => setLastSyncError(null), []);

  const triggerSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setLastSyncMessage(null);
    setLastSyncError(null);

    try {
      const res = await assignmentService.triggerSync();
      const status = res.syncLog?.status;
      const isFailed = !res.success
        || status === 'FAILED'
        || status === 'SKIPPED'
        || res.message.toLowerCase().includes('unavailable')
        || res.message.toLowerCase().includes('skipped');

      if (isFailed) {
        setLastSyncError(res.message || 'LMS sync failed. You can try again using Sync with LMS.');
      } else {
        setLastSyncMessage(res.message || 'LMS synced successfully');
        // Update student lastSync timestamp in session ONLY on real success
        if (authState.user && 'studentId' in authState.user) {
          const syncTimestamp = res.syncLog?.completedAt || res.syncLog?.startedAt || new Date().toISOString();
          authState.user.lastSync = syncTimestamp;
          authService.persistUserSession(authState.user);
        }
      }
      // Trigger re-render across all consumers so existing assignments & exams are refreshed
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setLastSyncError((err as Error).message || 'LMS sync failed. You can try again using Sync with LMS.');
    } finally {
      setSyncing(false);
    }
  }, [syncing, authState.user]);

  // Auto-dismiss success notification after 7 seconds
  useEffect(() => {
    if (lastSyncMessage) {
      const timer = setTimeout(() => {
        setLastSyncMessage(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [lastSyncMessage]);

  // Automatically trigger LMS sync once upon successful student login
  useEffect(() => {
    if (!authState.isAuthenticated || authState.role === 'admin') {
      return;
    }

    try {
      const isPendingAutoSync = sessionStorage.getItem('klu_pending_auto_sync') === 'true';
      if (isPendingAutoSync) {
        sessionStorage.removeItem('klu_pending_auto_sync');
        triggerSync();
      }
    } catch {
      // ignore storage access errors
    }
  }, [authState.isAuthenticated, authState.role, triggerSync]);

  return (
    <SyncContext.Provider
      value={{
        syncing,
        lastSyncMessage,
        lastSyncError,
        refreshKey,
        triggerSync,
        clearSyncMessage,
        clearSyncError,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside <SyncProvider>');
  return ctx;
}
