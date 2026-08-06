'use client';

import { BerthGantt } from '@/components/BerthGantt';
import { BerthStatusPanel } from '@/components/BerthStatusPanel';
import { BERTHS } from '@/data/portData';
import { usePort } from '@/context/PortContext';

export default function BerthsPage() {
  const { scenario, selectedVesselId, setSelectedVesselId } = usePort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Причалы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Загрузка и Gantt-занятость причалов Актау
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <BerthStatusPanel
          berths={BERTHS}
          assignments={scenario.assignments}
        />
        <BerthGantt
          berths={BERTHS}
          slots={scenario.timeline}
          selectedVesselId={selectedVesselId}
          onSelectVessel={setSelectedVesselId}
        />
      </div>
    </div>
  );
}
