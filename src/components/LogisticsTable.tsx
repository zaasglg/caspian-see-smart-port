'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Assignment, AssignmentStatus } from '@/types/port';

interface LogisticsTableProps {
  assignments: Assignment[];
  selectedVesselId?: string | null;
  onSelectVessel?: (vesselId: string) => void;
}

const STATUS_META: Record<
  AssignmentStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  OPTIMAL: { label: 'Оптимально', variant: 'secondary' },
  WAITING: { label: 'Ожидание', variant: 'outline' },
  STORM_DELAY: { label: 'Шторм', variant: 'destructive' },
  DRAFT_WARNING: { label: 'Конфликт осадки', variant: 'outline' },
};

export function LogisticsTable({
  assignments,
  selectedVesselId = null,
  onSelectVessel,
}: LogisticsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-end justify-between gap-4">
        <div>
          <CardTitle>Расписание</CardTitle>
          <CardDescription>Судно → причал → состав КТЖ</CardDescription>
        </div>
        <Badge variant="secondary">{assignments.length}</Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Судно</TableHead>
              <TableHead>Груз</TableHead>
              <TableHead>Причал</TableHead>
              <TableHead>КТЖ</TableHead>
              <TableHead>Ожидание</TableHead>
              <TableHead>Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((row) => {
              const meta = STATUS_META[row.status];
              const selected = row.vessel.id === selectedVesselId;
              return (
                <TableRow
                  key={row.vessel.id}
                  onClick={() => onSelectVessel?.(row.vessel.id)}
                  className={cn(
                    'cursor-pointer',
                    selected && 'bg-muted/60',
                  )}
                >
                  <TableCell>
                    <p className="font-medium">{row.vessel.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ETA {row.vessel.etaMin} мин · {row.vessel.draft} м
                    </p>
                  </TableCell>
                  <TableCell>
                    {row.vessel.cargoType}
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {row.vessel.cargoTons.toLocaleString('ru-RU')} т
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.berth ? (
                      <>
                        <p className="font-medium">{row.berth.id}</p>
                        <p className="max-w-[160px] truncate text-xs text-muted-foreground">
                          {row.berth.name}
                        </p>
                      </>
                    ) : (
                      <Badge variant="destructive">Нет</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.train ? (
                      <>
                        <p className="font-medium">{row.train.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.train.wagons} ваг · {row.train.readyMin} мин
                        </p>
                      </>
                    ) : (
                      <Badge variant="outline">Ожидает</Badge>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.waitTime} мин
                  </TableCell>
                  <TableCell>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
