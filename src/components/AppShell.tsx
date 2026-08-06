'use client';

import { Header } from '@/components/Header';
import { VesselDetailDrawer } from '@/components/VesselDetailDrawer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PortProvider, usePort } from '@/context/PortContext';
import { STORM_WIND_THRESHOLD } from '@/data/portData';
import { CloudLightning } from 'lucide-react';

function ShellBody({ children }: { children: React.ReactNode }) {
  const {
    isSafeWeather,
    effectiveWindSpeed,
    selectedAssignment,
    setSelectedVesselId,
  } = usePort();

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <Header />

      <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-5 pb-20 pt-8 sm:gap-8 sm:px-8">
        {!isSafeWeather && (
          <Alert variant="destructive">
            <CloudLightning />
            <AlertTitle>Штормовые условия у Актау</AlertTitle>
            <AlertDescription>
              Ветер {effectiveWindSpeed.toFixed(1)} м/с превышает порог{' '}
              {STORM_WIND_THRESHOLD} м/с · операции замедлены по фактической
              погоде Актау.
            </AlertDescription>
          </Alert>
        )}

        {children}

        <Separator />
        <footer className="text-center text-xs text-muted-foreground">
          Caspian Smart Port AI · порт Актау
        </footer>
      </div>

      <VesselDetailDrawer
        assignment={selectedAssignment}
        onClose={() => setSelectedVesselId(null)}
      />
    </main>
  );
}

function PortShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-3 px-5 py-24">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <PortProvider userId={user?.id ?? null}>
      <ShellBody>{children}</ShellBody>
    </PortProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortShell>{children}</PortShell>
    </AuthProvider>
  );
}
