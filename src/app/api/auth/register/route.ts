import { NextResponse } from 'next/server';
import {
  createUser,
  findUserByEmail,
  hashPassword,
  setSessionCookie,
} from '@/lib/auth-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';

    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Укажите имя (минимум 2 символа)' },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Некорректный email' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль минимум 6 символов' },
        { status: 400 },
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Этот email уже зарегистрирован' },
        { status: 409 },
      );
    }

    const user = {
      id: `U-${Date.now().toString(36)}`,
      email,
      name,
    };
    await createUser({
      ...user,
      passwordHash: hashPassword(email, password),
    });
    await setSessionCookie(user);
    return NextResponse.json({ user });
  } catch (err) {
    console.error('register', err);
    return NextResponse.json(
      { error: 'Ошибка регистрации' },
      { status: 500 },
    );
  }
}
