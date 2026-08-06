'use client';

import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Anchor, Ship, TrainFront } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BERTHS, PORT_CENTER, TRAINS } from '@/data/portData';
import type { Assignment, Vessel } from '@/types/port';

interface PortMapProps {
  assignments: Assignment[];
  vessels: Vessel[];
  stormMode: boolean;
  selectedVesselId?: string | null;
  draftPin?: { lat: number; lon: number } | null;
  onSelectVessel?: (vesselId: string) => void;
  onMapClick?: (lat: number, lon: number) => void;
}

type LayerKey = 'berths' | 'vessels' | 'trains' | 'routes';

const CARGO_COLOR: Record<string, string> = {
  Oil: '#ff9f0a',
  Grain: '#34c759',
  Container: '#0071e3',
};

function makeIcon(kind: 'ship' | 'berth' | 'train' | 'pin', color: string, selected = false) {
  const size = selected ? 36 : kind === 'pin' ? 28 : 30;
  const svg =
    kind === 'ship'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.7 5.4 1.62 6"/><path d="M12 10V3"/><path d="M12 3h4l2 3H12"/></svg>`
      : kind === 'train'
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M4 15h16"/><path d="M6 15V7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v8"/><rect x="6" y="11" width="12" height="4" rx="1"/><circle cx="8.5" cy="18.5" r="1.5"/><circle cx="15.5" cy="18.5" r="1.5"/></svg>`
        : kind === 'pin'
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4"><path d="M12 22s8-4.5 8-11a8 8 0 1 0-16 0c0 6.5 8 11 8 11z"/><circle cx="12" cy="11" r="2.5"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><circle cx="12" cy="5" r="3"/><path d="M12 22V8"/><path d="M5 12H2"/><path d="M22 12h-3"/></svg>`;

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:999px;background:${color};display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.25);border:${selected ? '3px solid #111' : '2px solid #fff'}">${svg}</div>`,
  });
}

function FitBounds({
  pointsKey,
  points,
}: {
  pointsKey: string;
  points: [number, number][];
}) {
  const map = useMap();
  useEffect(() => {
    const run = () => {
      map.invalidateSize();
      if (points.length === 0) {
        map.setView(PORT_CENTER, 13);
        return;
      }
      if (points.length === 1) {
        map.setView(points[0], 13);
        return;
      }
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
    };
    const t = window.setTimeout(run, 50);
    return () => window.clearTimeout(t);
    // pointsKey is the stable dependency; points used inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pointsKey]);
  return null;
}

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    window.addEventListener('port-map-resize', onResize);
    const t = window.setTimeout(onResize, 100);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('port-map-resize', onResize);
      window.clearTimeout(t);
    };
  }, [map]);
  return null;
}

function MapClick({
  onMapClick,
}: {
  onMapClick?: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function PortMapInner({
  assignments,
  vessels,
  stormMode,
  selectedVesselId = null,
  draftPin = null,
  onSelectVessel,
  onMapClick,
}: PortMapProps) {
  const [layers, setLayers] = useState<LayerKey[]>([
    'berths',
    'vessels',
    'trains',
    'routes',
  ]);

  const showBerths = layers.includes('berths');
  const showVessels = layers.includes('vessels');
  const showTrains = layers.includes('trains');
  const showRoutes = layers.includes('routes');

  const icons = useMemo(
    () => ({
      berth: makeIcon('berth', '#34c759'),
      train: makeIcon('train', '#ff9f0a'),
      pin: makeIcon('pin', '#af52de'),
      shipOil: makeIcon('ship', CARGO_COLOR.Oil),
      shipGrain: makeIcon('ship', CARGO_COLOR.Grain),
      shipContainer: makeIcon('ship', CARGO_COLOR.Container),
      shipOilSel: makeIcon('ship', CARGO_COLOR.Oil, true),
      shipGrainSel: makeIcon('ship', CARGO_COLOR.Grain, true),
      shipContainerSel: makeIcon('ship', CARGO_COLOR.Container, true),
    }),
    [],
  );

  const shipIconFor = (cargoType: string, selected: boolean) => {
    if (cargoType === 'Oil') return selected ? icons.shipOilSel : icons.shipOil;
    if (cargoType === 'Grain')
      return selected ? icons.shipGrainSel : icons.shipGrain;
    return selected ? icons.shipContainerSel : icons.shipContainer;
  };

  const routes = useMemo(() => {
    return assignments
      .filter((a) => a.berth)
      .map((a) => {
        const positions: [number, number][] = [
          [a.vessel.lat, a.vessel.lon],
          [a.berth!.lat, a.berth!.lon],
        ];
        if (a.train) positions.push([a.train.lat, a.train.lon]);
        return {
          key: a.vessel.id,
          positions,
          color: CARGO_COLOR[a.vessel.cargoType] ?? '#0071e3',
          selected: a.vessel.id === selectedVesselId,
        };
      });
  }, [assignments, selectedVesselId]);

  const fitPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (showVessels) vessels.forEach((v) => pts.push([v.lat, v.lon]));
    if (showBerths) BERTHS.forEach((b) => pts.push([b.lat, b.lon]));
    if (showTrains) TRAINS.forEach((t) => pts.push([t.lat, t.lon]));
    if (draftPin) pts.push([draftPin.lat, draftPin.lon]);
    if (pts.length === 0) pts.push(PORT_CENTER);
    return pts;
  }, [vessels, showVessels, showBerths, showTrains, draftPin]);

  const fitPointsKey = useMemo(
    () =>
      fitPoints.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join('|'),
    [fitPoints],
  );

  return (
    <Card className="relative z-0 overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <CardTitle>Карта</CardTitle>
          <CardDescription>
            Порт Актау · клик по карте ставит точку нового судна
            {stormMode ? ' · шторм' : ''}
          </CardDescription>
        </div>
        <ToggleGroup
          variant="outline"
          size="sm"
          multiple
          value={layers}
          onValueChange={(values) => {
            if (values.length === 0) return;
            setLayers(values as LayerKey[]);
          }}
        >
          <ToggleGroupItem value="berths">
            <Anchor data-icon="inline-start" />
            Причал
          </ToggleGroupItem>
          <ToggleGroupItem value="vessels">
            <Ship data-icon="inline-start" />
            Суда
          </ToggleGroupItem>
          <ToggleGroupItem value="trains">
            <TrainFront data-icon="inline-start" />
            КТЖ
          </ToggleGroupItem>
          <ToggleGroupItem value="routes">Маршруты</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="relative z-0 px-0 pb-0 sm:px-0">
        <div className="relative z-0 h-[420px] isolate overflow-hidden border-t sm:h-[500px]">
          <MapContainer
            center={PORT_CENTER}
            zoom={13}
            className="relative z-0 h-full w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <MapResizeFix />
            <FitBounds pointsKey={fitPointsKey} points={fitPoints} />
            <MapClick onMapClick={onMapClick} />

            {showRoutes &&
              routes.map((r) => (
                <Polyline
                  key={r.key}
                  positions={r.positions}
                  pathOptions={{
                    color: r.color,
                    weight: r.selected ? 4 : 2.5,
                    dashArray: '8 8',
                    opacity: r.selected ? 0.95 : 0.55,
                  }}
                />
              ))}

            {showBerths &&
              BERTHS.map((berth) => {
                const vessel = assignments.find(
                  (a) => a.berth?.id === berth.id,
                )?.vessel;
                return (
                  <Marker
                    key={berth.id}
                    position={[berth.lat, berth.lon]}
                    icon={icons.berth}
                  >
                    <Tooltip direction="top" offset={[0, -12]}>
                      {berth.name}
                    </Tooltip>
                    <Popup>
                      <strong>{berth.name}</strong>
                      <br />
                      {berth.cargoType} · max {berth.maxDraft} м
                      <br />
                      {vessel ? `Судно: ${vessel.name}` : 'Свободен'}
                    </Popup>
                  </Marker>
                );
              })}

            {showVessels &&
              vessels.map((vessel) => {
                const assignment = assignments.find(
                  (a) => a.vessel.id === vessel.id,
                );
                const selected = vessel.id === selectedVesselId;
                return (
                  <Marker
                    key={vessel.id}
                    position={[vessel.lat, vessel.lon]}
                    icon={shipIconFor(vessel.cargoType, selected)}
                    zIndexOffset={selected ? 1200 : 600}
                    eventHandlers={{
                      click: () => onSelectVessel?.(vessel.id),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -14]} permanent={selected}>
                      {vessel.name}
                    </Tooltip>
                    <Popup>
                      <strong>{vessel.name}</strong>
                      <br />
                      {vessel.cargoType} · {vessel.cargoTons} т
                      <br />
                      Осадка {vessel.draft} м · ETA {vessel.etaMin} мин
                      <br />
                      {assignment?.berth
                        ? `→ ${assignment.berth.id} · ожидание ${assignment.waitTime} мин`
                        : 'Без причала'}
                    </Popup>
                  </Marker>
                );
              })}

            {showTrains &&
              TRAINS.map((train) => (
                <Marker
                  key={train.id}
                  position={[train.lat, train.lon]}
                  icon={icons.train}
                >
                  <Tooltip direction="top" offset={[0, -12]}>
                    {train.id} · {train.cargoType}
                  </Tooltip>
                </Marker>
              ))}

            {draftPin && (
              <Marker
                position={[draftPin.lat, draftPin.lon]}
                icon={icons.pin}
                zIndexOffset={1500}
              >
                <Tooltip permanent direction="top" offset={[0, -12]}>
                  Новое судно
                </Tooltip>
              </Marker>
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PortMap(props: PortMapProps) {
  return <PortMapInner {...props} />;
}
