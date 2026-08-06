'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const fieldClass =
  'h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';
const labelClass = 'mb-1.5 block text-xs text-muted-foreground';

function AuthFormInner({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, user, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && user) {
      router.replace(next.startsWith('/') ? next : '/');
    }
  }, [ready, user, router, next]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    const ok =
      mode === 'login'
        ? await login(email, password)
        : await register(name, email, password);
    setPending(false);
    if (ok) router.replace(next.startsWith('/') ? next : '/');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Вход' : 'Регистрация'}</CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Войдите, чтобы управлять флотом и портом Актау'
            : 'Создайте аккаунт, чтобы добавлять суда и пользоваться ситуационным центром'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <div>
              <label className={labelClass} htmlFor="name">
                Имя
              </label>
              <input
                id="name"
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}
          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={fieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className={fieldClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              minLength={6}
              required
            />
          </div>

          <Button type="submit" disabled={pending} className="mt-1 w-full">
            {pending
              ? '…'
              : mode === 'login'
                ? 'Войти'
                : 'Зарегистрироваться'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <>
              Нет аккаунта?{' '}
              <Link
                href={`/register?next=${encodeURIComponent(next)}`}
                className="underline underline-offset-2"
              >
                Регистрация
              </Link>
            </>
          ) : (
            <>
              Уже есть аккаунт?{' '}
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="underline underline-offset-2"
              >
                Войти
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Загрузка…</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <AuthFormInner mode={mode} />
    </Suspense>
  );
}
