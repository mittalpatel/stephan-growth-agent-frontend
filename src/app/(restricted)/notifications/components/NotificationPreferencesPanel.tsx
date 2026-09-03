'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { t } from '@/locales';
import type { NotificationEventType } from '@/services/notifications';

import { useNotificationPreferences } from '../hooks/useNotificationPreferences';

const copy = t.notifications;

/** Mirrors `apps.notifications.constants.NON_OPTIONAL_EVENT_TYPES` — the backend
 * refuses to persist a disabling row for these regardless, but disabling the
 * switch here means the user never fires that request and gets that error. */
const NON_OPTIONAL: readonly NotificationEventType[] = [
  'password_reset_otp',
  'signup_verification_otp',
];

export default function NotificationPreferencesPanel() {
  const { preferences, isSaving, setPreference } = useNotificationPreferences();

  const eventTypes = Object.keys(preferences) as NotificationEventType[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.preferences.title}</CardTitle>
        <CardDescription>{copy.preferences.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {eventTypes.map((eventType) => {
          const required = NON_OPTIONAL.includes(eventType);
          const enabled = preferences[eventType]?.email ?? true;
          return (
            <div key={eventType} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{copy.eventType[eventType] ?? eventType}</p>
                {required && (
                  <p className="text-muted-foreground text-xs">{copy.preferences.requiredNote}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">
                  {copy.preferences.channelEmail}
                </span>
                <Switch
                  checked={enabled}
                  disabled={required || isSaving}
                  onCheckedChange={(checked) => void setPreference(eventType, 'email', checked)}
                  aria-label={`${copy.preferences.channelEmail}: ${copy.eventType[eventType] ?? eventType}`}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
