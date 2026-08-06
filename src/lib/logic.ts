import {
  CO2_FACTOR,
  DEMURRAGE_USD_PER_HOUR,
  FUEL_IDLE_TPH,
  STORM_DELAY_MIN,
} from '@/data/portData';
import type {
  Assignment,
  AssignmentStatus,
  AiSavings,
  Berth,
  BerthSlot,
  KPIs,
  PortAlert,
  Train,
  Vessel,
} from '@/types/port';

const UNLOAD_MIN_PER_1000T = 45;

export function unloadDuration(cargoTons: number): number {
  return Math.ceil((cargoTons / 1000) * UNLOAD_MIN_PER_1000T);
}

function cloneBerths(berths: Berth[]): Berth[] {
  return berths.map((b) => ({ ...b }));
}

function compatibleBerths(vessel: Vessel, berths: Berth[]): Berth[] {
  return berths.filter(
    (b) => b.cargoType === vessel.cargoType && b.maxDraft >= vessel.draft,
  );
}

function pickBestBerth(
  vessel: Vessel,
  candidates: Berth[],
  optimizeMode: boolean,
): Berth | null {
  if (candidates.length === 0) return null;

  if (!optimizeMode) {
    const preferred = candidates.find((b) => b.id === vessel.preferredBerth);
    return preferred ?? candidates[0];
  }

  return [...candidates].sort((a, b) => {
    const waitA = Math.max(0, a.busyUntilMin - vessel.etaMin);
    const waitB = Math.max(0, b.busyUntilMin - vessel.etaMin);
    if (waitA !== waitB) return waitA - waitB;

    const prefA = a.id === vessel.preferredBerth ? 0 : 1;
    const prefB = b.id === vessel.preferredBerth ? 0 : 1;
    if (prefA !== prefB) return prefA - prefB;

    return a.maxDraft - b.maxDraft;
  })[0];
}

function resolveStatus(
  waitTime: number,
  isSafeWeather: boolean,
  draftTight: boolean,
): AssignmentStatus {
  if (!isSafeWeather) return 'STORM_DELAY';
  if (draftTight) return 'DRAFT_WARNING';
  if (waitTime > 30) return 'WAITING';
  return 'OPTIMAL';
}

export function assignBerths(
  vessels: Vessel[],
  berths: Berth[],
  isSafeWeather: boolean,
  optimizeMode: boolean,
): Assignment[] {
  const pool = cloneBerths(berths);
  const stormPenalty = isSafeWeather ? 0 : STORM_DELAY_MIN;

  const ordered = optimizeMode
    ? [...vessels].sort((a, b) => a.etaMin - b.etaMin || a.draft - b.draft)
    : [...vessels];

  const assignments: Assignment[] = [];

  for (const vessel of ordered) {
    const effectiveEta = vessel.etaMin + stormPenalty;
    const candidates = compatibleBerths(vessel, pool);
    const berth = pickBestBerth(
      { ...vessel, etaMin: effectiveEta },
      candidates,
      optimizeMode,
    );

    if (!berth) {
      assignments.push({
        vessel,
        berth: null,
        train: null,
        waitTime: stormPenalty + 240,
        status: isSafeWeather ? 'WAITING' : 'STORM_DELAY',
      });
      continue;
    }

    const waitTime = Math.max(0, berth.busyUntilMin - effectiveEta) + stormPenalty;
    const startMin = Math.max(berth.busyUntilMin, effectiveEta);
    const endMin = startMin + unloadDuration(vessel.cargoTons);
    berth.busyUntilMin = endMin;

    const draftMargin = berth.maxDraft - vessel.draft;
    const draftTight = draftMargin < 0.4;

    assignments.push({
      vessel,
      berth: { ...berth },
      train: null,
      waitTime,
      status: resolveStatus(waitTime, isSafeWeather, draftTight),
    });
  }

  return assignments.sort((a, b) => a.vessel.etaMin - b.vessel.etaMin);
}

export function matchTrains(
  assignments: Assignment[],
  trains: Train[],
  optimizeMode: boolean,
): Assignment[] {
  const available = trains.map((t) => ({ ...t, used: false }));

  return assignments.map((assignment) => {
    const cargoType = assignment.vessel.cargoType;
    const berthReady =
      (assignment.berth?.busyUntilMin ?? assignment.vessel.etaMin) -
      unloadDuration(assignment.vessel.cargoTons) +
      assignment.waitTime;

    const candidates = available.filter(
      (t) => !t.used && t.cargoType === cargoType,
    );

    if (candidates.length === 0) {
      return { ...assignment, train: null };
    }

    let chosen: (typeof available)[number];

    if (optimizeMode) {
      chosen = [...candidates].sort((a, b) => {
        const dwellA = Math.max(0, berthReady - a.readyMin);
        const dwellB = Math.max(0, berthReady - b.readyMin);
        if (dwellA !== dwellB) return dwellA - dwellB;
        return a.readyMin - b.readyMin;
      })[0];
    } else {
      chosen = candidates[0];
    }

    chosen.used = true;

    const extraWait = Math.max(0, chosen.readyMin - berthReady);
    const waitTime = assignment.waitTime + (optimizeMode ? extraWait * 0.25 : extraWait);

    let status = assignment.status;
    if (status === 'OPTIMAL' && waitTime > 30) {
      status = 'WAITING';
    }

    return {
      ...assignment,
      train: {
        id: chosen.id,
        cargoType: chosen.cargoType,
        readyMin: chosen.readyMin,
        wagons: chosen.wagons,
        station: chosen.station,
        lat: chosen.lat,
        lon: chosen.lon,
      },
      waitTime: Math.round(waitTime),
      status,
    };
  });
}

export function computeKPIs(assignments: Assignment[]): KPIs {
  if (assignments.length === 0) {
    return {
      avgWaitMin: 0,
      totalWagonDwellHours: 0,
      totalCo2Tons: 0,
      totalDemurrageUsd: 0,
      totalFuelTonnes: 0,
    };
  }

  const avgWaitMin =
    assignments.reduce((sum, a) => sum + a.waitTime, 0) / assignments.length;

  let totalWagonDwellHours = 0;

  for (const a of assignments) {
    if (!a.train) continue;
    const berthFreeApprox = a.vessel.etaMin + a.waitTime;
    const dwellMin = Math.max(0, berthFreeApprox - a.train.readyMin);
    totalWagonDwellHours += (dwellMin / 60) * a.train.wagons;
  }

  const totalFuelTonnes = assignments.reduce(
    (sum, a) => sum + (a.waitTime / 60) * FUEL_IDLE_TPH,
    0,
  );

  const totalCo2Tons = totalFuelTonnes * CO2_FACTOR;
  const totalDemurrageUsd =
    assignments.reduce((sum, a) => sum + a.waitTime / 60, 0) *
    DEMURRAGE_USD_PER_HOUR;

  return {
    avgWaitMin: Number(avgWaitMin.toFixed(1)),
    totalWagonDwellHours: Number(totalWagonDwellHours.toFixed(1)),
    totalCo2Tons: Number(totalCo2Tons.toFixed(2)),
    totalDemurrageUsd: Math.round(totalDemurrageUsd),
    totalFuelTonnes: Number(totalFuelTonnes.toFixed(2)),
  };
}

export function deltaPercent(optimized: number, baseline: number): number {
  if (baseline === 0) return optimized === 0 ? 0 : -100;
  return Number((((optimized - baseline) / baseline) * 100).toFixed(1));
}

export function buildBerthTimeline(assignments: Assignment[]): BerthSlot[] {
  return assignments
    .filter((a): a is Assignment & { berth: NonNullable<Assignment['berth']> } =>
      Boolean(a.berth),
    )
    .map((a) => {
      const duration = unloadDuration(a.vessel.cargoTons);
      const endMin = a.berth.busyUntilMin;
      const startMin = Math.max(0, endMin - duration);
      return {
        berthId: a.berth.id,
        berthName: a.berth.name,
        vesselId: a.vessel.id,
        vesselName: a.vessel.name,
        cargoType: a.vessel.cargoType,
        startMin,
        endMin,
        status: a.status,
      };
    })
    .sort((a, b) => a.startMin - b.startMin || a.berthId.localeCompare(b.berthId));
}

export function computeAiSavings(ai: KPIs, chaos: KPIs): AiSavings {
  const demurrageUsd = Math.max(0, chaos.totalDemurrageUsd - ai.totalDemurrageUsd);
  const co2Tons = Math.max(0, Number((chaos.totalCo2Tons - ai.totalCo2Tons).toFixed(2)));
  const waitMin = Math.max(0, Number((chaos.avgWaitMin - ai.avgWaitMin).toFixed(1)));
  const wagonDwellHours = Math.max(
    0,
    Number((chaos.totalWagonDwellHours - ai.totalWagonDwellHours).toFixed(1)),
  );

  return {
    demurrageUsd,
    co2Tons,
    waitMin,
    wagonDwellHours,
    demurragePct: Math.abs(deltaPercent(ai.totalDemurrageUsd, chaos.totalDemurrageUsd)),
    co2Pct: Math.abs(deltaPercent(ai.totalCo2Tons, chaos.totalCo2Tons)),
  };
}

export function demurrageForWait(waitMin: number): number {
  return Math.round((waitMin / 60) * DEMURRAGE_USD_PER_HOUR);
}

export function buildAlerts(
  assignments: Assignment[],
  kpis: KPIs,
  isSafeWeather: boolean,
): PortAlert[] {
  const alerts: PortAlert[] = [];

  if (!isSafeWeather) {
    alerts.push({
      id: 'storm-global',
      severity: 'critical',
      title: 'Штормовое ограничение',
      detail: 'Ветер выше порога 12 м/с. Швартовка задерживается на +180 мин.',
    });
  }

  for (const a of assignments) {
    if (a.status === 'STORM_DELAY') {
      alerts.push({
        id: `storm-${a.vessel.id}`,
        severity: 'critical',
        title: `${a.vessel.name}: штормовая задержка`,
        detail: `Ожидание ${a.waitTime} мин · демередж ~$${demurrageForWait(a.waitTime).toLocaleString('en-US')}`,
        vesselId: a.vessel.id,
      });
    } else if (a.status === 'DRAFT_WARNING') {
      alerts.push({
        id: `draft-${a.vessel.id}`,
        severity: 'warning',
        title: `${a.vessel.name}: конфликт осадки`,
        detail: a.berth
          ? `Осадка ${a.vessel.draft} м при лимите ${a.berth.maxDraft} м на ${a.berth.id}`
          : `Осадка ${a.vessel.draft} м — подходящий причал ограничен`,
        vesselId: a.vessel.id,
      });
    } else if (a.waitTime > 60) {
      alerts.push({
        id: `wait-${a.vessel.id}`,
        severity: 'warning',
        title: `${a.vessel.name}: длительное ожидание`,
        detail: `${a.waitTime} мин на рейде · риск демереджа $${demurrageForWait(a.waitTime).toLocaleString('en-US')}`,
        vesselId: a.vessel.id,
      });
    }

    if (a.train && a.berth) {
      const berthStart = Math.max(0, a.berth.busyUntilMin - unloadDuration(a.vessel.cargoTons));
      const dwell = Math.max(0, berthStart - a.train.readyMin);
      if (dwell > 45) {
        alerts.push({
          id: `dwell-${a.vessel.id}`,
          severity: 'warning',
          title: `КТЖ ${a.train.id}: простой вагонов`,
          detail: `Состав готов на ${a.train.readyMin} мин, судно подойдёт ~${berthStart} мин · простой ~${dwell} мин`,
          vesselId: a.vessel.id,
        });
      }
    }

    if (!a.berth) {
      alerts.push({
        id: `noberth-${a.vessel.id}`,
        severity: 'critical',
        title: `${a.vessel.name}: нет причала`,
        detail: `Тип ${a.vessel.cargoType}, осадка ${a.vessel.draft} м — свободного совместимого причала нет`,
        vesselId: a.vessel.id,
      });
    }
  }

  if (kpis.totalDemurrageUsd > 50000) {
    alerts.push({
      id: 'demurrage-total',
      severity: 'info',
      title: 'Накопленный демередж',
      detail: `Суммарный риск простоя судов: $${kpis.totalDemurrageUsd.toLocaleString('en-US')}`,
    });
  }

  const rank = { critical: 0, warning: 1, info: 2 } as const;
  return alerts
    .sort((a, b) => rank[a.severity] - rank[b.severity])
    .slice(0, 8);
}
