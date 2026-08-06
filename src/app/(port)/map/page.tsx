'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AlertsPanel } from '@/components/AlertsPanel';
import { DataSourcesCard } from '@/components/DataSourcesCard';
import { Button } from '@/components/ui/button';
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
    <Skeleton className="h-[420px] w-full rounded-xl sm:h-[500px]" />
  ),
});

export default function MapPage() {
  const { user } = useAuth();
  const {
    scenario,
    vessels,
    isSafeWeather,
    selectedVesselId,
    setSelectedVesselId,
    isGuest,
  } = usePort();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Карта</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isGuest
            ? 'Гостевой режим · карта и AI доступны всем'
            : 'Ваш флот · AI назначит причалы'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <AlertsPanel
            alerts={scenario.alerts}
            selectedVesselId={selectedVesselId}
            onSelectVessel={setSelectedVesselId}
          />
          {isGuest ? (
            <Card>
              <CardHeader>
                <CardTitle>Свой флот</CardTitle>
                <CardDescription>
                  Добавлять и менять суда можно в профиле после регистрации
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button render={<Link href="/register?next=/profile" />} nativeButton={false}>
                  Создать профиль
                </Button>
                <Button
                  variant="outline"
                  render={<Link href="/login?next=/profile" />}
                  nativeButton={false}
                >
                  Уже есть аккаунт — войти
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Профиль</CardTitle>
                <CardDescription>
                  {user?.name} · управление судами
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button render={<Link href="/profile" />} nativeButton={false}>
                  Открыть профиль · {vessels.length} судов
                </Button>
              </CardContent>
            </Card>
          )}
          <DataSourcesCard />
        </div>
        <PortMap
          assignments={scenario.assignments}
          vessels={vessels}
          stormMode={!isSafeWeather}
          selectedVesselId={selectedVesselId}
          onSelectVessel={setSelectedVesselId}
        />
      </div>
    </div>
  );
}
