'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Info,
  Radar,
  Siren,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePort } from '@/context/PortContext';
import type { AlertSeverity, PortAlert } from '@/types/port';

const SEVERITY_META: Record<
  AlertSeverity,
  { label: string; icon: typeof Siren; tone: string }
> = {
  critical: {
    label: 'Критично',
    icon: Siren,
    tone: 'critical',
  },
  warning: {
    label: 'Внимание',
    icon: AlertTriangle,
    tone: 'warning',
  },
  info: {
    label: 'Инфо',
    icon: Info,
    tone: 'info',
  },
};

type Filter = 'all' | AlertSeverity;

export default function AlertsPage() {
  const { scenario, selectedVesselId, setSelectedVesselId, isGuest } =
    usePort();
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const base = { critical: 0, warning: 0, info: 0, all: 0 };
    for (const a of scenario.alerts) {
      base[a.severity] += 1;
      base.all += 1;
    }
    return base;
  }, [scenario.alerts]);

  const filtered = useMemo(() => {
    if (filter === 'all') return scenario.alerts;
    return scenario.alerts.filter((a) => a.severity === filter);
  }, [scenario.alerts, filter]);

  return (
    <div className="alerts-page flex flex-col gap-7">
      <section className="alerts-hero">
        <div className="alerts-hero__copy">
          <p className="alerts-kicker">
            <Radar className="size-3.5" />
            Situational feed · Актау
          </p>
          <h1 className="alerts-title">Алерты порта</h1>
          <p className="alerts-lead">
            Риски шторма, осадки, ожидания судов и простоя КТЖ — в одной ленте.
            {isGuest
              ? ' Нажмите алерт, чтобы посмотреть детали.'
              : ' Нажмите алерт, чтобы открыть судно.'}
          </p>
        </div>

        <div className="alerts-stats">
          <StatCard
            label="Всего"
            value={counts.all}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <StatCard
            label="Критично"
            value={counts.critical}
            tone="critical"
            active={filter === 'critical'}
            onClick={() => setFilter('critical')}
          />
          <StatCard
            label="Внимание"
            value={counts.warning}
            tone="warning"
            active={filter === 'warning'}
            onClick={() => setFilter('warning')}
          />
          <StatCard
            label="Инфо"
            value={counts.info}
            tone="info"
            active={filter === 'info'}
            onClick={() => setFilter('info')}
          />
        </div>
      </section>

      <section className="alerts-board">
        <div className="alerts-board__head">
          <h2 className="alerts-board__title">Лента событий</h2>
          <p className="alerts-board__meta">
            Показано {filtered.length} из {counts.all}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="alerts-empty">
            <Info className="size-5 opacity-70" />
            <div>
              <p className="font-medium">Пока тихо</p>
              <p className="text-sm text-muted-foreground">
                Нет алертов в выбранном фильтре. Порт в штатном режиме.
              </p>
            </div>
          </div>
        ) : (
          <div className="alerts-grid">
            {filtered.map((alert, index) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                index={index}
                active={
                  alert.vesselId != null && alert.vesselId === selectedVesselId
                }
                onSelect={() => {
                  if (alert.vesselId) setSelectedVesselId(alert.vesselId);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone?: 'critical' | 'warning' | 'info';
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'alerts-stat',
        tone && `alerts-stat--${tone}`,
        active && 'is-active',
      )}
    >
      <span className="alerts-stat__label">{label}</span>
      <span className="alerts-stat__value">{value}</span>
    </button>
  );
}

function AlertCard({
  alert,
  index,
  active,
  onSelect,
}: {
  alert: PortAlert;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  const meta = SEVERITY_META[alert.severity];
  const Icon = meta.icon;
  const clickable = Boolean(alert.vesselId);

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onSelect}
      className={cn(
        'alerts-card',
        `alerts-card--${meta.tone}`,
        active && 'is-active',
        clickable ? 'is-clickable' : 'is-static',
      )}
    >
      <div className="alerts-card__top">
        <span className="alerts-card__icon">
          <Icon className="size-4" />
        </span>
        <span className="alerts-card__sev">{meta.label}</span>
        <span className="alerts-card__idx">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <h3 className="alerts-card__title">{alert.title}</h3>
      <p className="alerts-card__detail">{alert.detail}</p>
      {alert.vesselId ? (
        <p className="alerts-card__hint">Открыть карточку судна →</p>
      ) : null}
    </button>
  );
}
