'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Berth, BerthSlot } from '@/types/port';

interface BerthGanttProps {
  berths: Berth[];
  slots: BerthSlot[];
  selectedVesselId?: string | null;
  onSelectVessel?: (vesselId: string) => void;
}

const CARGO_COLOR: Record<string, string> = {
  Oil: 'bg-chart-2',
  Grain: 'bg-chart-3',
  Container: 'bg-primary',
};

function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export function BerthGantt({
  berths,
  slots,
  selectedVesselId = null,
  onSelectVessel,
}: BerthGanttProps) {
  const { horizon, ticks } = useMemo(() => {
    const maxEnd = Math.max(60, ...slots.map((s) => s.endMin), 0);
    const horizonMin = Math.ceil(maxEnd / 30) * 30 + 30;
    const step = horizonMin > 360 ? 60 : 30;
    const marks: number[] = [];
    for (let t = 0; t <= horizonMin; t += step) marks.push(t);
    return { horizon: horizonMin, ticks: marks };
  }, [slots]);

  const byBerth = useMemo(() => {
    return berths.map((berth) => ({
      berth,
      slots: slots.filter((s) => s.berthId === berth.id),
    }));
  }, [berths, slots]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <CardTitle>Таймлайн причалов</CardTitle>
          <CardDescription>
            Gantt · занятость причалов Актау на горизонте операций
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Oil</Badge>
          <Badge variant="secondary">Grain</Badge>
          <Badge>Container</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="mb-2 ml-[88px] flex justify-between pr-1 text-[11px] tabular-nums text-muted-foreground">
              {ticks.map((t) => (
                <span
                  key={t}
                  className="w-0 -translate-x-1/2 text-center first:translate-x-0 last:translate-x-[-100%]"
                >
                  {formatMin(t)}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {byBerth.map(({ berth, slots: rowSlots }) => (
                <div key={berth.id} className="flex items-center gap-3">
                  <div className="w-[76px] shrink-0">
                    <p className="text-sm font-semibold">{berth.id}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {berth.cargoType}
                    </p>
                  </div>

                  <div className="relative h-11 flex-1 overflow-hidden rounded-xl bg-muted">
                    {ticks.slice(1, -1).map((t) => (
                      <div
                        key={`${berth.id}-g${t}`}
                        className="absolute top-0 bottom-0 w-px bg-border"
                        style={{ left: `${(t / horizon) * 100}%` }}
                      />
                    ))}

                    {rowSlots.map((slot) => {
                      const left = (slot.startMin / horizon) * 100;
                      const width = Math.max(
                        2.5,
                        ((slot.endMin - slot.startMin) / horizon) * 100,
                      );
                      const selected = slot.vesselId === selectedVesselId;
                      return (
                        <Button
                          key={`${slot.berthId}-${slot.vesselId}`}
                          type="button"
                          size="sm"
                          variant={selected ? 'default' : 'secondary'}
                          className={cn(
                            'absolute top-1.5 bottom-1.5 h-auto justify-start overflow-hidden px-2.5',
                            CARGO_COLOR[slot.cargoType],
                            selected && 'ring-2 ring-ring ring-offset-1',
                          )}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                          title={`${slot.vesselName} · ${formatMin(slot.startMin)}–${formatMin(slot.endMin)} · ${slot.status}`}
                          onClick={() => onSelectVessel?.(slot.vesselId)}
                        >
                          <span className="truncate text-[11px] font-semibold tracking-tight">
                            {slot.vesselName.replace(
                              /^(MT|MV|MSC|Caspian)\s+/i,
                              '',
                            )}
                          </span>
                        </Button>
                      );
                    })}

                    {rowSlots.length === 0 && (
                      <span className="absolute inset-0 flex items-center px-3 text-xs text-muted-foreground">
                        Свободен
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
