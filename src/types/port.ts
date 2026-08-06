export type CargoType = 'Oil' | 'Grain' | 'Container';

export type AssignmentStatus =
  | 'OPTIMAL'
  | 'WAITING'
  | 'STORM_DELAY'
  | 'DRAFT_WARNING';

export interface Berth {
  id: string;
  name: string;
  cargoType: CargoType;
  maxDraft: number;
  lat: number;
  lon: number;
  busyUntilMin: number;
}

export interface Vessel {
  id: string;
  name: string;
  cargoType: CargoType;
  draft: number;
  etaMin: number;
  cargoTons: number;
  lat: number;
  lon: number;
  preferredBerth: string;
}

export interface Train {
  id: string;
  cargoType: CargoType;
  readyMin: number;
  wagons: number;
  station: string;
  lat: number;
  lon: number;
}

export interface Assignment {
  vessel: Vessel;
  berth: Berth | null;
  train: Train | null;
  waitTime: number;
  status: AssignmentStatus;
}

export interface KPIs {
  avgWaitMin: number;
  totalWagonDwellHours: number;
  totalCo2Tons: number;
  totalDemurrageUsd: number;
  totalFuelTonnes: number;
}

export interface WeatherData {
  windSpeed: number;
  temp: number;
  isSafe: boolean;
  isMock: boolean;
}

export interface BerthSlot {
  berthId: string;
  berthName: string;
  vesselId: string;
  vesselName: string;
  cargoType: CargoType;
  startMin: number;
  endMin: number;
  status: AssignmentStatus;
}

export interface AiSavings {
  demurrageUsd: number;
  co2Tons: number;
  waitMin: number;
  wagonDwellHours: number;
  demurragePct: number;
  co2Pct: number;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface PortAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  vesselId?: string;
}
