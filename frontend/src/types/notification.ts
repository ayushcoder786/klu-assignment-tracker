export interface NotificationPreferences {
  id?: string;
  newAssignment: boolean;
  dueTomorrow: boolean;
  dueToday: boolean;
  overdue: boolean;
  deadlineChanged: boolean;
  updatedAt?: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface NotificationStatus {
  subscribed: boolean;
  pushServiceAvailable: boolean;
}
