'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Assignment, Berth } from '@/types/port';

interface BerthStatusPanelProps {
  berths: Berth[];
  assignments: Assignment[];
}

function loadPercent(berth: Berth, assignments: Assignment[]): number {
  const assigned = assignments.filter((a) => a.berth?.id === berth.id);
  if (assigned.length === 0 && berth.busyUntilMin === 0) return 8;
  const base = Math.min(100, 25 + assigned.length * 28 + berth.busyUntilMin / 8);
  return Math.round(Math.min(98, base));
}

export function BerthStatusPanel({
  berths,
  assignments,
}: BerthStatusPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Причалы</CardTitle>
        <CardDescription>Загрузка порта Актау</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {berths.map((berth) => {
          const vessel = assignments.find(
            (a) => a.berth?.id === berth.id,
          )?.vessel;
          const pct = loadPercent(berth, assignments);

          return (
            <div key={berth.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {berth.id}
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      {berth.cargoType}
                    </span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {vessel ? vessel.name : 'Свободен'}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {pct}%
                </span>
              </div>
              <Progress value={pct} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
