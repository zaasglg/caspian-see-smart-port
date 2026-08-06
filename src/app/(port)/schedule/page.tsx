'use client';

import { BerthGantt } from '@/components/BerthGantt';
import { LogisticsTable } from '@/components/LogisticsTable';
import { BERTHS } from '@/data/portData';
import { usePort } from '@/context/PortContext';

export default function SchedulePage() {
  const { scenario, selectedVesselId, setSelectedVesselId } = usePort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Расписание</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Мультимодальная таблица и таймлайн операций
        </p>
      </div>

      <LogisticsTable
        assignments={scenario.assignments}
        selectedVesselId={selectedVesselId}
        onSelectVessel={setSelectedVesselId}
      />

      <BerthGantt
        berths={BERTHS}
        slots={scenario.timeline}
        selectedVesselId={selectedVesselId}
        onSelectVessel={setSelectedVesselId}
      />
    </div>
  );
}
