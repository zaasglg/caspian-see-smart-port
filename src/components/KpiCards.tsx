'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { KPIs } from '@/types/port';
import { deltaPercent } from '@/lib/logic';

interface KpiCardsProps {
  current: KPIs;
  baseline: KPIs;
  optimizeMode: boolean;
}

interface CardConfig {
  key: keyof KPIs;
  label: string;
  format: (v: number) => string;
  unit: string;
}

const CARDS: CardConfig[] = [
  {
    key: 'avgWaitMin',
    label: 'Ожидание',
    format: (v) => v.toFixed(1),
    unit: 'мин',
  },
  {
    key: 'totalWagonDwellHours',
    label: 'Простой КТЖ',
    format: (v) => v.toFixed(1),
    unit: 'ваг·ч',
  },
  {
    key: 'totalCo2Tons',
    label: 'CO₂',
    format: (v) => v.toFixed(2),
    unit: 'т',
  },
  {
    key: 'totalDemurrageUsd',
    label: 'Демередж',
    format: (v) => `$${Math.round(v / 1000).toLocaleString('en-US')}k`,
    unit: '',
  },
];

export function KpiCards({ current, baseline, optimizeMode }: KpiCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const value = current[card.key];
        const base = baseline[card.key];
        const delta = deltaPercent(value, base);
        const improved = delta < 0;
        const DeltaIcon = improved ? TrendingDown : TrendingUp;

        return (
          <Card key={card.key}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <CardDescription>{card.label}</CardDescription>
              <Badge variant={improved ? 'secondary' : delta === 0 ? 'outline' : 'destructive'}>
                <DeltaIcon data-icon="inline-start" />
                {delta > 0 ? '+' : ''}
                {delta}%
              </Badge>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-3xl tabular-nums tracking-tight">
                {card.format(value)}
                {card.unit ? (
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                    {card.unit}
                  </span>
                ) : null}
              </CardTitle>
              <p className="mt-2 text-xs text-muted-foreground">
                {optimizeMode ? 'против Manual' : 'против AI'}{' '}
                <span className="font-medium text-foreground/70">
                  {card.key === 'totalDemurrageUsd'
                    ? `$${base.toLocaleString('en-US')}`
                    : `${base}${card.unit ? ` ${card.unit}` : ''}`}
                </span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
