import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiRefreshCw, FiBell, FiLogOut, FiCheckCircle, FiAlertCircle,
  FiSmartphone, FiToggleLeft, FiToggleRight, FiInfo
} from 'react-icons/fi';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Switch } from '../../components/common/Switch';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { authService } from '../../services/authService';
import {
  getVapidPublicKey,
  registerPushSubscription,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationStatus,
} from '../../services/notificationService';
import type { NotificationPreferences } from '../../types/notification';

// ─── Toggle setting component ─────────────────────────────────────────────────

interface ToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleSetting({ id, label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`
        flex items-center justify-between gap-4 py-3.5 px-2.5 -mx-2.5 rounded-2xl
        border-b border-slate-200/80 dark:border-slate-800/80 last:border-0
        hover:bg-slate-100/70 dark:hover:bg-white/[0.02]
        transition-colors duration-150 cursor-pointer
        ${disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}
      `}
    >
      <div className="flex-1 min-w-0 pr-3">
        <label htmlFor={id} className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer block leading-tight">
          {label}
        </label>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 leading-normal">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={label}
      />
    </div>
  );
}

// ─── Permission status badge ──────────────────────────────────────────────────

type PermissionState = NotificationPermission | 'unsupported';

function PermissionBadge({ state }: { state: PermissionState }) {
  const configs: Record<PermissionState, { label: string; color: string }> = {
    granted: { label: 'Allowed', color: 'text-emerald-800 bg-emerald-50 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-500/40 font-bold' },
    denied: { label: 'Blocked', color: 'text-red-800 bg-red-50 border-red-300 dark:text-red-300 dark:bg-red-950/80 dark:border-red-500/40 font-bold' },
    default: { label: 'Not set', color: 'text-slate-700 bg-slate-100 border-slate-300 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700 font-bold' },
    unsupported: { label: 'Unsupported', color: 'text-amber-800 bg-amber-50 border-amber-300 dark:text-amber-300 dark:bg-amber-950/80 dark:border-amber-500/40 font-bold' },
  };
  const { label, color } = configs[state];
  return (
    <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  );
}

// ─── Main Settings page ───────────────────────────────────────────────────────

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { syncing, triggerSync, lastSyncMessage, lastSyncError } = useSync();

  // ── Notification permission & subscription state ──────────────────────────
  const [permissionState, setPermissionState] = useState<PermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);
  const [pushServiceAvailable, setPushServiceAvailable] = useState(true);

  // ── Notification preferences ──────────────────────────────────────────────
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    newAssignment: true,
    dueTomorrow: true,
    dueToday: true,
    overdue: true,
    deadlineChanged: true,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load initial notification state
  useEffect(() => {
    // Check if push is supported in this browser
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermissionState('unsupported');
      return;
    }
    setPermissionState(Notification.permission);

    const token = authService.getToken();
    if (!token) return;

    // Load subscription status and preferences in parallel
    Promise.all([
      getNotificationStatus(token),
      getNotificationPreferences(token),
    ]).then(([status, savedPrefs]) => {
      setIsSubscribed(status.subscribed);
      setPushServiceAvailable(status.pushServiceAvailable);
      setPrefs(savedPrefs);
      setPrefsLoaded(true);
    }).catch(() => {
      setPrefsLoaded(true);
    });
  }, []);

  // ── Enable push notifications ─────────────────────────────────────────────
  const handleEnableNotifications = useCallback(async () => {
    setNotifLoading(true);
    setNotifError(null);
    setNotifSuccess(null);

    try {
      // 1. Request browser permission — only triggered by explicit user action
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== 'granted') {
        setNotifError(
          'Notification permission was denied. ' +
          'To enable notifications, click the lock/info icon in your browser\'s address bar ' +
          'and allow notifications for this site.'
        );
        return;
      }

      // 2. Get VAPID public key from backend
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        setNotifError('Push notifications are not currently configured on the server. Please contact your administrator.');
        return;
      }

      // 3. Create a PushSubscription in the browser
      const subscriptionPayload = await registerPushSubscription(vapidPublicKey);

      // 4. Send the subscription to the backend for storage
      const token = authService.getToken();
      if (!token) throw new Error('Not authenticated. Please log in again.');
      await subscribeToNotifications(subscriptionPayload, token);

      setIsSubscribed(true);
      setNotifSuccess('Push notifications enabled! You will receive assignment reminders on this device.');
    } catch (err: unknown) {
      setNotifError((err as Error).message || 'Failed to enable notifications. Please try again.');
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // ── Disable push notifications ────────────────────────────────────────────
  const handleDisableNotifications = useCallback(async () => {
    setNotifLoading(true);
    setNotifError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const token = authService.getToken();
        if (token) {
          await unsubscribeFromNotifications(subscription.endpoint, token);
        }
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setNotifSuccess('Push notifications disabled for this device.');
    } catch (err: unknown) {
      setNotifError((err as Error).message || 'Failed to disable notifications.');
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // ── Save notification preferences ─────────────────────────────────────────
  const handleSavePrefs = useCallback(async (updatedPrefs: NotificationPreferences) => {
    const token = authService.getToken();
    if (!token) return;

    setPrefsSaving(true);
    try {
      const saved = await updateNotificationPreferences(updatedPrefs, token);
      setPrefs(saved);
      setNotifSuccess('Notification preferences saved.');
      setTimeout(() => setNotifSuccess(null), 3000);
    } catch {
      setNotifError('Failed to save preferences. Please try again.');
    } finally {
      setPrefsSaving(false);
    }
  }, []);

  const togglePref = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    handleSavePrefs(updated);
  }, [prefs, handleSavePrefs]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const pushSupported = permissionState !== 'unsupported';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Settings</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage your preferences and account</p>
      </div>

      {/* ── LMS Sync ─────────────────────────────────────────────────────── */}
      <Card>
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">Data Synchronization</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          Manually trigger a sync to fetch the latest assignments and courses directly from KLU Moodle LMS.
          The system also automatically syncs every 30 minutes while you are logged in.
        </p>
        {lastSyncMessage && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4 text-sm bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            <FiCheckCircle size={17} className="shrink-0 mt-0.5" />
            <p>{lastSyncMessage}</p>
          </div>
        )}
        {lastSyncError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4 text-sm bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 text-red-800 dark:text-red-300">
            <FiAlertCircle size={17} className="shrink-0 mt-0.5" />
            <p>{lastSyncError}</p>
          </div>
        )}
        <Button onClick={triggerSync} loading={syncing} icon={<FiRefreshCw size={16} />}>
          {syncing ? 'Synchronizing…' : 'Synchronize Now'}
        </Button>
      </Card>

      {/* ── Push Notifications ────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Push Notifications</h3>
          <PermissionBadge state={permissionState} />
        </div>

        {/* Success / Error feedback */}
        {notifSuccess && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4 text-sm bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            <FiCheckCircle size={17} className="shrink-0 mt-0.5" />
            <p>{notifSuccess}</p>
          </div>
        )}
        {notifError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-4 text-sm bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 text-red-800 dark:text-red-300">
            <FiAlertCircle size={17} className="shrink-0 mt-0.5" />
            <p>{notifError}</p>
          </div>
        )}

        {/* Browser unsupported */}
        {!pushSupported ? (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/8 border border-amber-300 dark:border-amber-500/20">
            <FiInfo size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Not supported in this browser</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Push notifications require a modern browser with service worker support (Chrome, Firefox, Edge, Safari 16.4+).
              </p>
            </div>
          </div>
        ) : !pushServiceAvailable ? (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/8 border border-amber-300 dark:border-amber-500/20">
            <FiInfo size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Push notifications are not configured on the server yet. Set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables to enable them.
            </p>
          </div>
        ) : permissionState === 'denied' ? (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-500/8 border border-red-300 dark:border-red-500/20">
            <FiAlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Notifications blocked by browser</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                You previously denied notifications. To re-enable them, click the lock/info icon in
                your browser's address bar, set Notifications to "Allow", then reload the page.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Receive assignment reminders on this device even when the app is not open.
              Notifications are delivered by your browser's push service — no personal data is shared.
            </p>
            <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSubscribed ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400'}`}>
                  <FiSmartphone size={17} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">This device</p>
                  <p className="text-xs text-slate-500">{isSubscribed ? 'Notifications active on this device' : 'Not subscribed'}</p>
                </div>
              </div>
              {isSubscribed ? (
                <button
                  onClick={handleDisableNotifications}
                  disabled={notifLoading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FiToggleRight size={18} />
                  Disable
                </button>
              ) : (
                <button
                  onClick={handleEnableNotifications}
                  disabled={notifLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {notifLoading ? (
                    <>
                      <FiRefreshCw size={13} className="animate-spin" />
                      Enabling…
                    </>
                  ) : (
                    <>
                      <FiToggleLeft size={18} />
                      Enable
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ── Notification Preferences ─────────────────────────────────────── */}
      {pushSupported && prefsLoaded && (
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Notification Preferences</h3>
            {prefsSaving && <span className="text-xs text-violet-600 dark:text-violet-400">Saving…</span>}
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Choose which events you want to be notified about. Changes are saved automatically.
          </p>

          <ToggleSetting
            id="pref-new-assignment"
            label="New Assignments"
            description="Notify when a new assignment is discovered during sync"
            checked={prefs.newAssignment}
            onChange={v => togglePref('newAssignment', v)}
            disabled={!isSubscribed}
          />
          <ToggleSetting
            id="pref-due-tomorrow"
            label="Due Tomorrow"
            description="Notify when an assignment is due in approximately 24 hours"
            checked={prefs.dueTomorrow}
            onChange={v => togglePref('dueTomorrow', v)}
            disabled={!isSubscribed}
          />
          <ToggleSetting
            id="pref-due-today"
            label="Due Today"
            description="Morning reminder for assignments due today"
            checked={prefs.dueToday}
            onChange={v => togglePref('dueToday', v)}
            disabled={!isSubscribed}
          />
          <ToggleSetting
            id="pref-overdue"
            label="Overdue Alerts"
            description="Get alerted immediately when an assignment becomes overdue"
            checked={prefs.overdue}
            onChange={v => togglePref('overdue', v)}
            disabled={!isSubscribed}
          />
          <ToggleSetting
            id="pref-deadline-changed"
            label="Deadline Changes"
            description="Notify when Moodle reports a changed due date for an existing assignment"
            checked={prefs.deadlineChanged}
            onChange={v => togglePref('deadlineChanged', v)}
            disabled={!isSubscribed}
          />

          {!isSubscribed && (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <FiBell size={13} />
              <span>Enable notifications above to configure your preferences.</span>
            </div>
          )}
        </Card>
      )}

      {/* ── Danger Zone ──────────────────────────────────────────────────── */}
      <Card className="border-red-500/20">
        <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-4">Danger Zone</h3>
        <p className="text-sm text-slate-400 mb-4">
          Logging out will end your current session. You'll need to log in again with your KLU Student ID and LMS Password.
        </p>
        <Button variant="danger" icon={<FiLogOut size={16} />} onClick={handleLogout}>
          Logout
        </Button>
      </Card>
    </div>
  );
}
