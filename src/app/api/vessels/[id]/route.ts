import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { deleteVessel } from '@/lib/vessels-db';

export const runtime = 'nodejs';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    const ok = await deleteVessel(user.id, id);
    if (!ok) {
      return NextResponse.json({ error: 'Судно не найдено' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('vessel DELETE', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
