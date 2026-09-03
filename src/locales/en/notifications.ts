export const notifications = {
  title: 'Notifications',
  description: 'Everything sent to you, across every organization you belong to.',
  bell: {
    label: 'Notifications',
    viewAll: 'View all',
    empty: 'No notifications yet',
    markAllRead: 'Mark all as read',
  },
  columns: {
    type: 'Type',
    received: 'Received',
    status: 'Status',
  },
  status: {
    read: 'Read',
    unread: 'Unread',
  },
  // Keys mirror `apps.notifications.constants.EventType` exactly — a missing
  // key falls back to the raw event string, so add here when adding there.
  eventType: {
    organization_invite: 'Organization invite',
    organization_added: 'Added to an organization',
    password_reset_otp: 'Password reset code',
    signup_verification_otp: 'Signup verification code',
    new_device_login: 'Sign-in from a new device',
    invite_accepted: 'Invite accepted',
    project_shared: 'A project was shared with you',
  },

  /**
   * Desktop/browser notification text, shown by `useBrowserNotifications` when
   * a notification arrives over the websocket while permission is granted.
   * `body` tokens are filled from the notification's own payload.
   */
  browser: {
    project_shared: {
      title: 'Project shared with you',
      body: '{granted_by} gave you {access_level} access to {project_name}',
      bodyNoActor: 'You were given {access_level} access to {project_name}',
    },
    invite_accepted: {
      title: 'Invite accepted',
      body: '{accepted_by} accepted your invitation',
    },
    enablePrompt: 'Enable desktop notifications',
    enabled: 'Desktop notifications enabled.',
    blocked: 'Desktop notifications are blocked in your browser settings.',
  },
  emptyTitle: 'No notifications',
  emptyDescription: "You're all caught up.",
  markRead: 'Mark as read',
  markAllRead: 'Mark all as read',
  markedRead: 'Notification marked as read.',
  allMarkedRead: 'All notifications marked as read.',
  errorTitle: "Couldn't load notifications",
  errorDescription: 'Something went wrong loading your notifications. Please try again.',
  preferences: {
    title: 'Notification preferences',
    description: 'Choose which notifications you receive by email.',
    channelEmail: 'Email',
    requiredNote: 'Required — carries a security code you need to complete the action.',
    updated: 'Preferences updated.',
    updateFailed: "Couldn't update this preference. Please try again.",
  },
} as const;
