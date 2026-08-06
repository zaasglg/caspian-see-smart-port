'use client';

import { Anchor, Ship, TrainFront } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Assignment } from '@/types/port';
import { demurrageForWait, unloadDuration } from '@/lib/logic';

interface VesselDetailDrawerProps {
  assignment: Assignment | null;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  OPTIMAL: 'Оптимально',
  WAITING: 'Ожидание',
  STORM_DELAY: 'Шторм',
  DRAFT_WARNING: 'Конфликт осадки',
};

export function VesselDetailDrawer({
  assignment,
  onClose,
}: VesselDetailDrawerProps) {
  const open = Boolean(assignment);
  const vessel = assignment?.vessel;
  const berth = assignment?.berth ?? null;
  const train = assignment?.train ?? null;
  const waitTime = assignment?.waitTime ?? 0;
  const status = assignment?.status ?? 'OPTIMAL';
  const demurrage = demurrageForWait(waitTime);
  const unload = vessel ? unloadDuration(vessel.cargoTons) : 0;
  const startMin = berth ? Math.max(0, berth.busyUntilMin - unload) : null;
  const endMin = berth?.busyUntilMin ?? null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
          window.setTimeout(
            () => window.dispatchEvent(new Event('port-map-resize')),
            220,
          );
        }
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md">
        {vessel && (
          <>
            <SheetHeader>
              <SheetDescription>Карточка судна</SheetDescription>
              <SheetTitle>{vessel.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">
                {vessel.cargoType} · {vessel.cargoTons.toLocaleString('ru-RU')} т
              </p>
            </SheetHeader>

            <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6">
              <div className="flex flex-wrap gap-2">
                <Badge>{STATUS_LABEL[status] ?? status}</Badge>
                <Badge variant="secondary">ETA {vessel.etaMin} мин</Badge>
                <Badge variant="outline">Осадка {vessel.draft} м</Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardDescription>Маршрут</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="default" className="size-9 justify-center rounded-full p-0">
                      <Ship />
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">Рейд / подход</p>
                      <p className="text-xs text-muted-foreground">
                        {vessel.lat.toFixed(4)}, {vessel.lon.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="size-9 justify-center rounded-full p-0">
                      <Anchor />
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {berth ? berth.name : 'Причал не назначен'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {berth
                          ? `max draft ${berth.maxDraft} м · ${startMin}–${endMin} мин`
                          : 'Нет совместимого слота'}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="size-9 justify-center rounded-full p-0">
                      <TrainFront />
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {train ? `КТЖ ${train.id}` : 'Состав не назначен'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {train
                          ? `${train.wagons} ваг · готов ${train.readyMin} мин · ${train.station}`
                          : 'Ожидает матчинг'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Ожидание</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {waitTime}
                      <span className="ml-1 text-sm font-medium text-muted-foreground">
                        мин
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Демередж</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      ${demurrage.toLocaleString('en-US')}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Выгрузка</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {unload}
                      <span className="ml-1 text-sm font-medium text-muted-foreground">
                        мин
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Предпочтение</CardDescription>
                    <CardTitle className="text-2xl">
                      {vessel.preferredBerth}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
