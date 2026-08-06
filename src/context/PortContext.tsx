'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { BERTHS, DEMO_VESSELS, TRAINS } from '@/data/portData';
import {
  assignBerths,
  buildAlerts,
  buildBerthTimeline,
  computeAiSavings,
  computeKPIs,
  matchTrains,
} from '@/lib/logic';
import { fetchAktauWeather } from '@/lib/weather';
import type {
  AiSavings,
  Assignment,
  BerthSlot,
  CargoType,
  KPIs,
  PortAlert,
  Vessel,
  WeatherData,
} from '@/types/port';

const INITIAL_WEATHER: WeatherData = {
  windSpeed: 5.5,
  temp: 22,
  isSafe: true,
  isMock: true,
};

export type VesselInput = {
  name: string;
  cargoType: CargoType;
  draft: number;
  etaMin: number;
  cargoTons: number;
  lat: number;
  lon: number;
  preferredBerth: string;
};

interface PortScenario {
  assignments: Assignment[];
  kpis: KPIs;
  baselineKpis: KPIs;
  savings: AiSavings;
  timeline: BerthSlot[];
  alerts: PortAlert[];
}

interface PortContextValue {
  optimizeMode: boolean;
  weather: WeatherData;
  clock: string;
  isSafeWeather: boolean;
  effectiveWindSpeed: number;
  selectedVesselId: string | null;
  selectedAssignment: Assignment | null;
  scenario: PortScenario;
  vessels: Vessel[];
  vesselsLoading: boolean;
  canManageFleet: boolean;
  isGuest: boolean;
  draftPin: { lat: number; lon: number } | null;
  setOptimizeMode: (value: boolean) => void;
  setSelectedVesselId: (id: string | null) => void;
  setDraftPin: (pin: { lat: number; lon: number } | null) => void;
  addVessel: (input: VesselInput) => Promise<void>;
  removeVessel: (id: string) => Promise<void>;
  loadDemoVessels: () => Promise<void>;
  clearVessels: () => Promise<void>;
}

const PortContext = createContext<PortContextValue | null>(null);

function requireFleetAccess(canManage: boolean) {
  if (canManage) return true;
  toast.message('Нужен профиль', {
    description: 'Войдите или зарегистрируйтесь, чтобы управлять судами',
  });
  return false;
}

export function PortProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string | null;
}) {
  const canManageFleet = Boolean(userId);
  const isGuest = !userId;

  const [optimizeMode, setOptimizeModeState] = useState(true);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData>(INITIAL_WEATHER);
  const [clock, setClock] = useState('');
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [vesselsLoading, setVesselsLoading] = useState(true);
  const [draftPin, setDraftPin] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [, startTransition] = useTransition();

  const refreshVessels = useCallback(async () => {
    setVesselsLoading(true);
    try {
      if (!userId) {
        setVessels(DEMO_VESSELS.map((v) => ({ ...v })));
        return;
      }
      const res = await fetch('/api/vessels', { credentials: 'include' });
      if (!res.ok) throw new Error('load failed');
      const data = (await res.json()) as { vessels: Vessel[] };
      setVessels(data.vessels);
    } catch {
      toast.error('Не удалось загрузить суда');
      setVessels([]);
    } finally {
      setVesselsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setSelectedVesselId(null);
    setDraftPin(null);
    void refreshVessels();
  }, [userId, refreshVessels]);

  const isSafeWeather = weather.isSafe;
  const effectiveWindSpeed = weather.windSpeed;

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      const data = await fetchAktauWeather();
      if (!cancelled) setWeather(data);
    }

    loadWeather();
    const weatherTimer = setInterval(loadWeather, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(weatherTimer);
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleString('ru-RU', {
          timeZone: 'Asia/Aqtau',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const scenario = useMemo<PortScenario>(() => {
    const aiAssignments = matchTrains(
      assignBerths(vessels, BERTHS, isSafeWeather, true),
      TRAINS,
      true,
    );
    const chaosAssignments = matchTrains(
      assignBerths(vessels, BERTHS, isSafeWeather, false),
      TRAINS,
      false,
    );

    const aiKpis = computeKPIs(aiAssignments);
    const chaosKpis = computeKPIs(chaosAssignments);
    const current = optimizeMode ? aiAssignments : chaosAssignments;
    const kpis = optimizeMode ? aiKpis : chaosKpis;

    return {
      assignments: current,
      kpis,
      baselineKpis: optimizeMode ? chaosKpis : aiKpis,
      savings: computeAiSavings(aiKpis, chaosKpis),
      timeline: buildBerthTimeline(current),
      alerts: buildAlerts(current, kpis, isSafeWeather),
    };
  }, [optimizeMode, isSafeWeather, vessels]);

  const selectedAssignment = useMemo(
    () =>
      scenario.assignments.find((a) => a.vessel.id === selectedVesselId) ?? null,
    [scenario.assignments, selectedVesselId],
  );

  const setOptimizeMode = useCallback((value: boolean) => {
    startTransition(() => setOptimizeModeState(value));
    toast.message(value ? 'AI Optimizing' : 'Manual (Chaos)', {
      description: value
        ? 'Минимум ожидания и лучший матч КТЖ'
        : 'Preferred berth / первый подходящий состав',
    });
  }, []);

  const addVessel = useCallback(
    async (input: VesselInput) => {
      if (!requireFleetAccess(canManageFleet)) return;
      const res = await fetch('/api/vessels', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', vessel: input }),
      });
      const data = (await res.json()) as { vessel?: Vessel; error?: string };
      if (!res.ok || !data.vessel) {
        toast.error('Не удалось добавить судно', {
          description: data.error || 'Попробуйте ещё раз',
        });
        return;
      }
      setVessels((prev) => [...prev, data.vessel!]);
      setDraftPin(null);
      toast.success('Судно добавлено', { description: data.vessel.name });
    },
    [canManageFleet],
  );

  const removeVessel = useCallback(
    async (id: string) => {
      if (!requireFleetAccess(canManageFleet)) return;
      const res = await fetch(`/api/vessels/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error('Не удалось удалить судно');
        return;
      }
      setVessels((prev) => prev.filter((v) => v.id !== id));
      setSelectedVesselId((cur) => (cur === id ? null : cur));
      toast.message('Судно удалено');
    },
    [canManageFleet],
  );

  const loadDemoVessels = useCallback(async () => {
    if (!requireFleetAccess(canManageFleet)) return;
    const res = await fetch('/api/vessels', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'demo' }),
    });
    const data = (await res.json()) as { vessels?: Vessel[]; error?: string };
    if (!res.ok || !data.vessels) {
      toast.error('Не удалось загрузить шаблон', {
        description: data.error || 'Попробуйте ещё раз',
      });
      return;
    }
    setVessels(data.vessels);
    toast.message('Шаблон флота загружен');
  }, [canManageFleet]);

  const clearVessels = useCallback(async () => {
    if (!requireFleetAccess(canManageFleet)) return;
    const res = await fetch('/api/vessels', {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      toast.error('Не удалось очистить флот');
      return;
    }
    setVessels([]);
    setSelectedVesselId(null);
    toast.message('Список судов очищен');
  }, [canManageFleet]);

  const value = useMemo<PortContextValue>(
    () => ({
      optimizeMode,
      weather,
      clock,
      isSafeWeather,
      effectiveWindSpeed,
      selectedVesselId,
      selectedAssignment,
      scenario,
      vessels,
      vesselsLoading,
      canManageFleet,
      isGuest,
      draftPin,
      setOptimizeMode,
      setSelectedVesselId,
      setDraftPin,
      addVessel,
      removeVessel,
      loadDemoVessels,
      clearVessels,
    }),
    [
      optimizeMode,
      weather,
      clock,
      isSafeWeather,
      effectiveWindSpeed,
      selectedVesselId,
      selectedAssignment,
      scenario,
      vessels,
      vesselsLoading,
      canManageFleet,
      isGuest,
      draftPin,
      setOptimizeMode,
      addVessel,
      removeVessel,
      loadDemoVessels,
      clearVessels,
    ],
  );

  return <PortContext.Provider value={value}>{children}</PortContext.Provider>;
}

export function usePort() {
  const ctx = useContext(PortContext);
  if (!ctx) {
    throw new Error('usePort must be used within PortProvider');
  }
  return ctx;
}
