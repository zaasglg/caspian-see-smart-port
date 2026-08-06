'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePort, type VesselInput } from '@/context/PortContext';
import { BERTHS, PORT_CENTER } from '@/data/portData';
import type { CargoType } from '@/types/port';

const CARGO_TYPES: CargoType[] = ['Oil', 'Grain', 'Container'];

const fieldClass =
  'h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

const labelClass = 'mb-1 block text-xs text-muted-foreground';

export function VesselManager() {
  const {
    vessels,
    draftPin,
    addVessel,
    removeVessel,
    loadDemoVessels,
    clearVessels,
    setSelectedVesselId,
    selectedVesselId,
  } = usePort();

  const [name, setName] = useState('');
  const [cargoType, setCargoType] = useState<CargoType>('Oil');
  const [draft, setDraft] = useState('6.0');
  const [etaMin, setEtaMin] = useState('45');
  const [cargoTons, setCargoTons] = useState('3000');
  const [lat, setLat] = useState(String(PORT_CENTER[0] + 0.01));
  const [lon, setLon] = useState(String(PORT_CENTER[1] - 0.02));
  const [preferredBerth, setPreferredBerth] = useState(
    BERTHS.find((b) => b.cargoType === 'Oil')?.id ?? BERTHS[0].id,
  );

  useEffect(() => {
    if (!draftPin) return;
    setLat(draftPin.lat.toFixed(5));
    setLon(draftPin.lon.toFixed(5));
  }, [draftPin]);

  useEffect(() => {
    const match = BERTHS.find((b) => b.cargoType === cargoType);
    if (match) setPreferredBerth(match.id);
  }, [cargoType]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const input: VesselInput = {
      name: trimmed,
      cargoType,
      draft: Number(draft) || 5.5,
      etaMin: Math.max(0, Math.round(Number(etaMin) || 30)),
      cargoTons: Math.max(1, Math.round(Number(cargoTons) || 1000)),
      lat: Number(lat) || PORT_CENTER[0],
      lon: Number(lon) || PORT_CENTER[1],
      preferredBerth,
    };
    await addVessel(input);
    setName('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Суда</CardTitle>
        <CardDescription>
          Добавляйте корабли сами · сохраняется в браузере
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div>
            <label className={labelClass} htmlFor="vessel-name">
              Название
            </label>
            <input
              id="vessel-name"
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MT Caspian Star"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass} htmlFor="cargo">
                Груз
              </label>
              <select
                id="cargo"
                className={fieldClass}
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value as CargoType)}
              >
                {CARGO_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="berth">
                Preferred berth
              </label>
              <select
                id="berth"
                className={fieldClass}
                value={preferredBerth}
                onChange={(e) => setPreferredBerth(e.target.value)}
              >
                {BERTHS.filter((b) => b.cargoType === cargoType).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} · {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelClass} htmlFor="draft">
                Осадка, м
              </label>
              <input
                id="draft"
                type="number"
                step="0.1"
                min="1"
                max="12"
                className={fieldClass}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="eta">
                ETA, мин
              </label>
              <input
                id="eta"
                type="number"
                min="0"
                className={fieldClass}
                value={etaMin}
                onChange={(e) => setEtaMin(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tons">
                Тонны
              </label>
              <input
                id="tons"
                type="number"
                min="1"
                className={fieldClass}
                value={cargoTons}
                onChange={(e) => setCargoTons(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass} htmlFor="lat">
                Lat
              </label>
              <input
                id="lat"
                type="number"
                step="0.0001"
                className={fieldClass}
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="lon">
                Lon
              </label>
              <input
                id="lon"
                type="number"
                step="0.0001"
                className={fieldClass}
                value={lon}
                onChange={(e) => setLon(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Кликните по карте справа, чтобы поставить координаты.
          </p>

          <Button type="submit" className="w-full">
            <Plus data-icon="inline-start" />
            Добавить судно
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={loadDemoVessels}>
            Шаблон флота
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearVessels}
            disabled={vessels.length === 0}
          >
            Очистить
          </Button>
          <Badge variant="secondary">{vessels.length} судов</Badge>
        </div>

        <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
          {vessels.length === 0 && (
            <li className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              Пока пусто — добавьте первое судно
            </li>
          )}
          {vessels.map((v) => (
            <li
              key={v.id}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                selectedVesselId === v.id ? 'border-foreground/30 bg-muted/50' : ''
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => setSelectedVesselId(v.id)}
              >
                <div className="truncate font-medium">{v.name}</div>
                <div className="text-xs text-muted-foreground">
                  {v.cargoType} · {v.cargoTons} т · ETA {v.etaMin} мин
                </div>
              </button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={`Удалить ${v.name}`}
                onClick={() => removeVessel(v.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
