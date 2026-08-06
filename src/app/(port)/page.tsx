'use client';

import { KpiCards } from '@/components/KpiCards';
import { SavingsBanner } from '@/components/SavingsBanner';
import { DataSourcesCard } from '@/components/DataSourcesCard';
import { usePort } from '@/context/PortContext';

export default function OverviewPage() {
  const { optimizeMode, scenario } = usePort();

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Порт Актау · KZAAU
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Caspian Smart Port AI
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Ситуационный центр открыт для гостей. Карта, KPI и AI — без входа.
          Добавлять суда можно в личном профиле после регистрации.
        </p>
      </section>

      <SavingsBanner
        savings={scenario.savings}
        optimizeMode={optimizeMode}
      />

      <KpiCards
        current={scenario.kpis}
        baseline={scenario.baselineKpis}
        optimizeMode={optimizeMode}
      />

      <DataSourcesCard />
    </div>
  );
}
