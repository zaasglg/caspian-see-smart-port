import type { Berth, Train, Vessel } from '@/types/port';

/**
 * Источники данных Caspian Smart Port AI
 * --------------------------------------
 * LIVE:
 *  - Погода Актау: Open-Meteo API (lat/lon порта)
 *
 * ФЛОТ:
 *  - Суда добавляются вручную в UI (localStorage)
 *  - Опциональный демо-набор DEMO_VESSELS
 *
 * СПРАВОЧНИК (открытые источники):
 *  - Центр порта / паром: OSM «Ақтау порты» ferry_terminal 43.6000645, 51.2187080
 *  - Станция КТЖ: OSM railway station «Ақтау порты» 43.5995627, 51.2225562
 *  - Офис порта: OSM 43.6026171, 51.2207133
 *  - Инфраструктура: portaktau.kz — 11 причалов, нефть / зерно / паром / генеральные
 *  - UN/LOCODE KZAAU · ~43.6000°N, 51.2166–51.2286°E
 *
 * СИМУЛЯЦИЯ (fallback / КТЖ):
 *  - Суда — демо, если нет ключа или нет трафика в bbox
 *  - Составы КТЖ и ETA/readyMin — сценарные
 */

export const PORT_META = {
  name: 'Актауский международный морской торговый порт',
  unlocode: 'KZAAU',
  operator: 'АО «НК «АММТП»',
  berthCountOfficial: 11,
  capacityMtPerYear: 11.8,
  sources: {
    weather: 'Open-Meteo',
    geography: 'OpenStreetMap Nominatim',
    infrastructure: 'portaktau.kz / LogCluster LCA',
    vessels: 'Manual fleet (local) · optional demo seed',
    trains: 'Simulated KTZ Aktau-Port yard (demo)',
  },
} as const;

/** OSM ferry terminal / waterfront of Aktau Sea Port */
export const PORT_CENTER: [number, number] = [43.6001, 51.2187];

/** OSM railway station «Ақтау порты» */
export const AKTAU_PORT_STATION: [number, number] = [43.5996, 51.2226];

export const DEMURRAGE_USD_PER_HOUR = 8500;
export const WAGON_DWELL_USD_PER_HOUR = 120;
export const FUEL_IDLE_TPH = 1.8;
export const CO2_FACTOR = 3.15;

export const STORM_WIND_THRESHOLD = 12;
export const STORM_DELAY_MIN = 180;

/**
 * Ключевые причалы/терминалы Актау.
 * Координаты — вдоль реальной акватории порта (OSM pier/ferry zone),
 * типы и осадки — по открытому описанию инфраструктуры АММТП / LCA.
 */
export const BERTHS: Berth[] = [
  {
    id: 'B1',
    name: 'Нефтеналивной причал №1',
    cargoType: 'Oil',
    maxDraft: 7.0,
    lat: 43.6018,
    lon: 51.2169,
    busyUntilMin: 0,
  },
  {
    id: 'B2',
    name: 'Нефтеналивной причал №2',
    cargoType: 'Oil',
    maxDraft: 7.0,
    lat: 43.6011,
    lon: 51.2176,
    busyUntilMin: 45,
  },
  {
    id: 'B3',
    name: 'Зерновой терминал',
    cargoType: 'Grain',
    maxDraft: 6.5,
    lat: 43.6004,
    lon: 51.2184,
    busyUntilMin: 20,
  },
  {
    id: 'B4',
    name: 'Универсальный / контейнеры',
    cargoType: 'Container',
    maxDraft: 6.2,
    lat: 43.5997,
    lon: 51.2192,
    busyUntilMin: 0,
  },
  {
    id: 'B5',
    name: 'Паромный комплекс (Ro-Ro)',
    cargoType: 'Grain',
    maxDraft: 5.5,
    lat: 43.6001,
    lon: 51.2187,
    busyUntilMin: 90,
  },
];

/**
 * Демо-набор судов (опционально «Загрузить демо»).
 * По умолчанию флот пустой — суда добавляете сами.
 */
export const DEMO_VESSELS: Vessel[] = [
  {
    id: 'V1',
    name: 'MT Caspian Star',
    cargoType: 'Oil',
    draft: 6.8,
    etaMin: 30,
    cargoTons: 4200,
    lat: 43.6125,
    lon: 51.1950,
    preferredBerth: 'B1',
  },
  {
    id: 'V2',
    name: 'MV Aktau Grain',
    cargoType: 'Grain',
    draft: 6.1,
    etaMin: 55,
    cargoTons: 3100,
    lat: 43.6180,
    lon: 51.2020,
    preferredBerth: 'B3',
  },
  {
    id: 'V3',
    name: 'MSC Mangystau',
    cargoType: 'Container',
    draft: 5.9,
    etaMin: 80,
    cargoTons: 2800,
    lat: 43.5905,
    lon: 51.1985,
    preferredBerth: 'B4',
  },
  {
    id: 'V4',
    name: 'MT Tengiz Spirit',
    cargoType: 'Oil',
    draft: 6.9,
    etaMin: 110,
    cargoTons: 5100,
    lat: 43.6220,
    lon: 51.1880,
    preferredBerth: 'B2',
  },
  {
    id: 'V5',
    name: 'MV Steppe Harvest',
    cargoType: 'Grain',
    draft: 5.4,
    etaMin: 140,
    cargoTons: 2600,
    lat: 43.5850,
    lon: 51.2060,
    preferredBerth: 'B5',
  },
  {
    id: 'V6',
    name: 'Caspian Boxer',
    cargoType: 'Container',
    draft: 5.8,
    etaMin: 165,
    cargoTons: 1900,
    lat: 43.6070,
    lon: 51.1840,
    preferredBerth: 'B4',
  },
];

/**
 * Составы на станции «Ақтау порты» (OSM) — симуляция КТЖ.
 * Точки разнесены вдоль реальной станционной зоны ~51.2226.
 */
export const TRAINS: Train[] = [
  {
    id: 'T1',
    cargoType: 'Oil',
    readyMin: 40,
    wagons: 28,
    station: 'Актау-Порт',
    lat: 43.6004,
    lon: 51.2214,
  },
  {
    id: 'T2',
    cargoType: 'Grain',
    readyMin: 70,
    wagons: 42,
    station: 'Актау-Порт',
    lat: 43.5999,
    lon: 51.2222,
  },
  {
    id: 'T3',
    cargoType: 'Container',
    readyMin: 95,
    wagons: 36,
    station: 'Актау-Порт',
    lat: 43.5994,
    lon: 51.2230,
  },
  {
    id: 'T4',
    cargoType: 'Oil',
    readyMin: 130,
    wagons: 32,
    station: 'Актау-Порт',
    lat: 43.5989,
    lon: 51.2238,
  },
  {
    id: 'T5',
    cargoType: 'Grain',
    readyMin: 160,
    wagons: 48,
    station: 'Актау-Порт',
    lat: 43.5984,
    lon: 51.2246,
  },
  {
    id: 'T6',
    cargoType: 'Container',
    readyMin: 190,
    wagons: 24,
    station: 'Актау-Порт',
    lat: 43.5979,
    lon: 51.2254,
  },
];
