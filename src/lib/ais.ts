import type { CargoType, Vessel } from '@/types/port';
import { BERTHS, PORT_CENTER } from '@/data/portData';

/**
 * Bounding box around Aktau / NE–Central Caspian for AISStream.
 * Official docs use [lat, lon] corners (see aisstream.io/documentation).
 * Wider than the port alone — Caspian AIS density is low.
 */
export const AKTAU_AIS_BBOX: [[number, number], [number, number]] = [
  [36.5, 47.0],
  [47.5, 55.0],
];

export type AisConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'live'
  | 'error'
  | 'unavailable';

export interface AisVesselSnapshot {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  sog?: number;
  cog?: number;
  shipType?: number;
  updatedAt: number;
}

export interface AisStreamEvent {
  type: 'status' | 'vessel' | 'error' | 'ping';
  status?: AisConnectionStatus;
  message?: string;
  vessel?: AisVesselSnapshot;
  count?: number;
}

export const AISSTREAM_MESSAGE_TYPES = [
  'PositionReport',
  'StandardClassBPositionReport',
  'ExtendedClassBPositionReport',
  'ShipStaticData',
  'StaticDataReport',
] as const;

function haversineKm(
  a: [number, number],
  b: [number, number],
): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** ITU ship type → our cargo buckets */
export function cargoFromShipType(shipType?: number): CargoType {
  if (shipType == null) return 'Container';
  if (shipType >= 80 && shipType <= 89) return 'Oil';
  if (shipType === 70 || shipType === 79) return 'Grain';
  if (shipType >= 70 && shipType <= 79) return 'Container';
  if (shipType >= 60 && shipType <= 69) return 'Container';
  return 'Container';
}

export function aisToVessel(snap: AisVesselSnapshot, index: number): Vessel {
  const cargoType = cargoFromShipType(snap.shipType);
  const preferred =
    BERTHS.find((b) => b.cargoType === cargoType)?.id ?? BERTHS[0].id;
  const distKm = haversineKm(PORT_CENTER, [snap.lat, snap.lon]);
  const sog = snap.sog && snap.sog > 0.3 ? snap.sog : 8;
  const etaMin = Math.max(15, Math.round((distKm / sog) * 60));

  return {
    id: `AIS-${snap.mmsi}`,
    name: snap.name?.trim() || `MMSI ${snap.mmsi}`,
    cargoType,
    draft: cargoType === 'Oil' ? 6.5 : cargoType === 'Grain' ? 5.8 : 5.5,
    etaMin: Math.min(240, etaMin + index * 5),
    cargoTons:
      cargoType === 'Oil' ? 4500 : cargoType === 'Grain' ? 3200 : 2200,
    lat: snap.lat,
    lon: snap.lon,
    preferredBerth: preferred,
  };
}

export function parseAisMessage(
  raw: unknown,
  staticTypes: Map<string, number>,
  staticNames: Map<string, string>,
): AisVesselSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const msg = raw as Record<string, unknown>;
  const messageType = String(msg.MessageType ?? '');
  const meta = (msg.MetaData ?? {}) as Record<string, unknown>;
  const message = (msg.Message ?? {}) as Record<string, unknown>;

  if (messageType === 'ShipStaticData') {
    const staticData = (message.ShipStaticData ?? {}) as Record<string, unknown>;
    const mmsi = String(staticData.UserID ?? meta.MMSI ?? '');
    if (!mmsi) return null;
    if (typeof staticData.Type === 'number') {
      staticTypes.set(mmsi, staticData.Type);
    }
    const name = String(staticData.Name ?? meta.ShipName ?? '').trim();
    if (name) staticNames.set(mmsi, name);
    return null;
  }

  if (messageType === 'StaticDataReport') {
    const staticData = (message.StaticDataReport ?? {}) as Record<
      string,
      unknown
    >;
    const reportA = (staticData.ReportA ?? {}) as Record<string, unknown>;
    const reportB = (staticData.ReportB ?? {}) as Record<string, unknown>;
    const mmsi = String(staticData.UserID ?? meta.MMSI ?? '');
    if (!mmsi) return null;

    const shipType = Number(reportB.ShipType);
    if (Number.isFinite(shipType)) staticTypes.set(mmsi, shipType);

    const name = String(reportA.Name ?? meta.ShipName ?? '').trim();
    if (name) staticNames.set(mmsi, name);
    return null;
  }

  const positionTypes = new Set([
    'PositionReport',
    'StandardClassBPositionReport',
    'ExtendedClassBPositionReport',
  ]);
  if (!positionTypes.has(messageType)) return null;

  const report = (message[messageType] ?? {}) as Record<string, unknown>;
  const mmsi = String(report.UserID ?? meta.MMSI ?? '');
  const lat = Number(report.Latitude ?? meta.latitude ?? meta.Latitude);
  const lon = Number(report.Longitude ?? meta.longitude ?? meta.Longitude);
  if (!mmsi || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

  const name =
    staticNames.get(mmsi) ||
    String(meta.ShipName ?? '').trim() ||
    `MMSI ${mmsi}`;

  return {
    mmsi,
    name,
    lat,
    lon,
    sog: Number(report.Sog ?? report.SOG ?? NaN) || undefined,
    cog: Number(report.Cog ?? report.COG ?? NaN) || undefined,
    shipType: staticTypes.get(mmsi),
    updatedAt: Date.now(),
  };
}
