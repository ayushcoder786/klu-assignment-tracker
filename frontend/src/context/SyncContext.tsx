import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { assignmentService } from '../services/assignmentService';
import { authService } from '../services/authService';
import { useAuth } from './AuthContext';

interface SyncContextValue {
  syncing: boolean;
  lastSyncMessage: string | null;
  lastSyncError: string | null;
  refreshKey: number;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { authState } = useAuth();

  const triggerSync = async () => {
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
        setLastSyncError(res.message);
      } else {
        setLastSyncMessage(res.message);
        // Update student lastSync timestamp in session ONLY on real success
        if (authState.user && 'studentId' in authState.user) {
          const syncTimestamp = res.syncLog?.completedAt || res.syncLog?.startedAt || new Date().toISOString();
          authState.user.lastSync = syncTimestamp;
          authService.persistUserSession(authState.user);
        }
      }
      // Trigger re-render across all consumers so existing assignments are refreshed
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setLastSyncError((err as Error).message || 'LMS is temporarily unavailable. Please try syncing again later.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SyncContext.Provider
      value={{
        syncing,
        lastSyncMessage,
        lastSyncError,
        refreshKey,
        triggerSync,
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
