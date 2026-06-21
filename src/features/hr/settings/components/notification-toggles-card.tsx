'use client';

import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { NotificationToggleGroup } from '@/features/hr/settings/constants/notification-groups';

type BooleanSettingsRecord = Partial<Record<string, boolean>>;

interface NotificationTogglesCardProps {
  title: string;
  description?: string;
  groups: NotificationToggleGroup[];
  values: BooleanSettingsRecord;
  disabled?: boolean;
  masterDisabled?: boolean;
  onToggle: (key: string, value: boolean) => void;
}

export function NotificationTogglesCard({
  title,
  description,
  groups,
  values,
  disabled,
  masterDisabled,
  onToggle,
}: NotificationTogglesCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {groups.map((group) => (
          <div key={group.label} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
            <div className="space-y-2">
              {group.items.map((item) => {
                const isMaster = item.key === 'notificationsEnabled';
                const rowDisabled =
                  disabled || (masterDisabled && !isMaster && item.key !== 'notificationsEnabled');

                return (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/10 px-4 py-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium leading-tight">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={Boolean(values[item.key])}
                      disabled={rowDisabled}
                      onCheckedChange={(v) => onToggle(item.key, v)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
