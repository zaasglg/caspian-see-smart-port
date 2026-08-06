import { NextResponse } from 'next/server';
import {
  findUserByEmail,
  hashPassword,
  setSessionCookie,
} from '@/lib/auth-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';

    const found = await findUserByEmail(email);
    if (!found || found.password_hash !== hashPassword(email, password)) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 },
      );
    }

    const user = { id: found.id, email: found.email, name: found.name };
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (err) {
    console.error('login', err);
    return NextResponse.json(
      { error: 'Ошибка входа' },
      { status: 500 },
    );
  }
}
