'use client';

import { AlertTriangle, Info, Siren } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PortAlert } from '@/types/port';

interface AlertsPanelProps {
  alerts: PortAlert[];
  selectedVesselId: string | null;
  onSelectVessel: (vesselId: string) => void;
}

export function AlertsPanel({
  alerts,
  selectedVesselId,
  onSelectVessel,
}: AlertsPanelProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-end justify-between gap-3">
        <div>
          <CardTitle>Алерты</CardTitle>
          <CardDescription>Живая лента рисков порта</CardDescription>
        </div>
        <Badge variant="secondary">{alerts.length}</Badge>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-[420px] pr-3">
          {alerts.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Info />
                </EmptyMedia>
                <EmptyTitle>Рисков нет</EmptyTitle>
                <EmptyDescription>
                  Порт в штатном режиме
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.map((alert) => {
                const active =
                  alert.vesselId != null &&
                  alert.vesselId === selectedVesselId;
                const clickable = Boolean(alert.vesselId);
                const Icon =
                  alert.severity === 'critical'
                    ? Siren
                    : alert.severity === 'warning'
                      ? AlertTriangle
                      : Info;

                return (
                  <button
                    key={alert.id}
                    type="button"
                    disabled={!clickable}
                    onClick={() => {
                      if (alert.vesselId) onSelectVessel(alert.vesselId);
                    }}
                    className={cn(
                      'w-full text-left',
                      clickable ? 'cursor-pointer' : 'cursor-default',
                    )}
                  >
                    <Alert
                      variant={
                        alert.severity === 'critical' ? 'destructive' : 'default'
                      }
                      className={cn(active && 'ring-2 ring-ring')}
                    >
                      <Icon />
                      <AlertTitle className="flex items-center gap-2">
                        <Badge
                          variant={
                            alert.severity === 'critical'
                              ? 'destructive'
                              : alert.severity === 'warning'
                                ? 'outline'
                                : 'secondary'
                          }
                        >
                          {alert.severity}
                        </Badge>
                        {alert.title}
                      </AlertTitle>
                      <AlertDescription>{alert.detail}</AlertDescription>
                    </Alert>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
