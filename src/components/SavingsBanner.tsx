'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AiSavings } from '@/types/port';

interface SavingsBannerProps {
  savings: AiSavings;
  optimizeMode: boolean;
}

function formatUsd(value: number): string {
  if (value >= 1000) {
    return `$${Math.round(value / 1000).toLocaleString('en-US')}k`;
  }
  return `$${value.toLocaleString('en-US')}`;
}

export function SavingsBanner({ savings, optimizeMode }: SavingsBannerProps) {
  return (
    <Card className="bg-primary text-primary-foreground">
      <CardHeader>
        <CardDescription className="text-primary-foreground/70">
          {optimizeMode ? 'Эффект AI Optimizing' : 'Потенциал AI vs текущий Manual'}
        </CardDescription>
        <CardTitle className="max-w-2xl text-balance text-2xl sm:text-3xl">
          AI экономит {formatUsd(savings.demurrageUsd)} и{' '}
          {savings.co2Tons.toFixed(1)} т CO₂
        </CardTitle>
        <p className="max-w-xl text-sm text-primary-foreground/75">
          Сравнение с хаотичным ручным назначением причалов и составов КТЖ на
          том же горизонте операций.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-primary-foreground/10 p-4">
            <p className="text-xs text-primary-foreground/70">Демередж</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              −{formatUsd(savings.demurrageUsd)}
            </p>
            <Badge variant="secondary" className="mt-2">
              −{savings.demurragePct}%
            </Badge>
          </div>
          <div className="rounded-xl bg-primary-foreground/10 p-4">
            <p className="text-xs text-primary-foreground/70">CO₂</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              −{savings.co2Tons.toFixed(1)} т
            </p>
            <Badge variant="secondary" className="mt-2">
              −{savings.co2Pct}%
            </Badge>
          </div>
          <div className="rounded-xl bg-primary-foreground/10 p-4">
            <p className="text-xs text-primary-foreground/70">Ожидание</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              −{savings.waitMin} мин
            </p>
            <p className="mt-2 text-xs text-primary-foreground/65">
              среднее на судно
            </p>
          </div>
          <div className="rounded-xl bg-primary-foreground/10 p-4">
            <p className="text-xs text-primary-foreground/70">Простой КТЖ</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              −{savings.wagonDwellHours}
            </p>
            <p className="mt-2 text-xs text-primary-foreground/65">ваг·ч</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
