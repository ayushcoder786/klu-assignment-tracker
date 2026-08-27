import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { assignmentService } from '../services/assignmentService';
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
      setLastSyncMessage(res.message);
      // Trigger re-render across all consumers
      setRefreshKey(k => k + 1);

      // Update student lastSync timestamp in session if user object exists
      if (authState.user) {
        (authState.user as any).lastSync = new Date().toISOString();
      }
    } catch (err: unknown) {
      setLastSyncError((err as Error).message || 'Failed to sync with KLU LMS');
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
