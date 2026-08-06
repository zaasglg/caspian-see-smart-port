'use client';

import dynamic from 'next/dynamic';
import { RequireAuth } from '@/components/RequireAuth';
import { VesselManager } from '@/components/VesselManager';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { usePort } from '@/context/PortContext';

const PortMap = dynamic(() => import('@/components/PortMap'), {
  ssr: false,
  loading: () => (
    <Skeleton className="h-[360px] w-full rounded-xl sm:h-[420px]" />
  ),
});

function ProfileContent() {
  const { user } = useAuth();
  const {
    scenario,
    vessels,
    isSafeWeather,
    selectedVesselId,
    setSelectedVesselId,
    draftPin,
    setDraftPin,
  } = usePort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Профиль</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Здесь вы добавляете суда и ведёте свой флот
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user?.name}</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Флот · {vessels.length}</Badge>
          <Badge variant="outline">Оператор порта Актау</Badge>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <VesselManager />
        <PortMap
          assignments={scenario.assignments}
          vessels={vessels}
          stormMode={!isSafeWeather}
          selectedVesselId={selectedVesselId}
          draftPin={draftPin}
          onSelectVessel={setSelectedVesselId}
          onMapClick={(lat, lon) => setDraftPin({ lat, lon })}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
