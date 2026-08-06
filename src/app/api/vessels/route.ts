import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { insertVessel, listVessels, clearVessels, replaceVessels } from '@/lib/vessels-db';
import { DEMO_VESSELS } from '@/data/portData';
import type { CargoType, Vessel } from '@/types/port';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const vessels = await listVessels(user.id);
    return NextResponse.json({ vessels });
  } catch (err) {
    console.error('vessels GET', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      action?: 'create' | 'demo';
      vessel?: Partial<Vessel>;
    };

    if (body.action === 'demo') {
      const vessels = DEMO_VESSELS.map((v, i) => ({
        ...v,
        id: `V-demo-${Date.now().toString(36)}-${i}`,
      }));
      await replaceVessels(user.id, vessels);
      return NextResponse.json({ vessels });
    }

    const input = body.vessel;
    if (!input?.name || !input.cargoType) {
      return NextResponse.json({ error: 'Некорректные данные судна' }, { status: 400 });
    }

    const vessel: Vessel = {
      id: `V-${Date.now().toString(36)}`,
      name: String(input.name).trim(),
      cargoType: input.cargoType as CargoType,
      draft: Number(input.draft) || 5.5,
      etaMin: Math.max(0, Math.round(Number(input.etaMin) || 30)),
      cargoTons: Math.max(1, Math.round(Number(input.cargoTons) || 1000)),
      lat: Number(input.lat),
      lon: Number(input.lon),
      preferredBerth: String(input.preferredBerth || 'B1'),
    };

    await insertVessel(user.id, vessel);
    return NextResponse.json({ vessel });
  } catch (err) {
    console.error('vessels POST', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await clearVessels(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('vessels DELETE', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
