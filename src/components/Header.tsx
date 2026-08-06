'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CloudLightning,
  CloudSun,
  LogIn,
  LogOut,
  Ship,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { usePort } from '@/context/PortContext';

const PUBLIC_NAV = [
  { href: '/', label: 'Обзор' },
  { href: '/map', label: 'Карта' },
  { href: '/schedule', label: 'Расписание' },
  { href: '/berths', label: 'Причалы' },
  { href: '/alerts', label: 'Алерты' },
] as const;

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    optimizeMode,
    setOptimizeMode,
    weather,
    effectiveWindSpeed,
    clock,
    vessels,
  } = usePort();

  const storm = !weather.isSafe;
  const navItems = user
    ? [...PUBLIC_NAV, { href: '/profile', label: 'Профиль' }]
    : [...PUBLIC_NAV];

  const onLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <header className="port-header sticky top-0 z-50">
      <div className="port-header__glow" aria-hidden />
      <div className="port-header__inner">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/" className="port-brand group">
              <span className="port-brand__mark" aria-hidden>
                <Ship className="size-4" strokeWidth={2.25} />
              </span>
              <span className="min-w-0">
                <span className="port-brand__title">Caspian Smart Port</span>
                <span className="port-brand__sub">
                  Актау · KZAAU · situational center
                </span>
              </span>
            </Link>

            <div className="port-chip hidden md:inline-flex">
              <Ship className="size-3.5 opacity-80" />
              <span>
                Флот · {vessels.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
            <div
              className={cn(
                'port-weather hidden sm:inline-flex',
                storm && 'port-weather--storm',
              )}
              title={
                weather.isMock
                  ? 'Резервные данные погоды'
                  : 'Погода Актау · live'
              }
            >
              {storm ? (
                <CloudLightning className="size-3.5" />
              ) : (
                <CloudSun className="size-3.5" />
              )}
              <span>
                {effectiveWindSpeed.toFixed(1)} м/с · {weather.temp.toFixed(0)}°
                {storm ? ' · шторм' : ''}
              </span>
            </div>

            <div className="port-mode" role="group" aria-label="Режим оптимизации">
              <button
                type="button"
                className={cn('port-mode__btn', optimizeMode && 'is-active')}
                onClick={() => setOptimizeMode(true)}
              >
                AI
              </button>
              <button
                type="button"
                className={cn('port-mode__btn', !optimizeMode && 'is-active')}
                onClick={() => setOptimizeMode(false)}
              >
                Manual
              </button>
            </div>

            {user ? (
              <>
                <Link href="/profile" className="port-btn port-btn--ghost">
                  <UserRound className="size-3.5" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Link>
                <button
                  type="button"
                  className="port-btn port-btn--ghost"
                  onClick={onLogout}
                  aria-label="Выйти"
                >
                  <LogOut className="size-3.5" />
                  <span className="hidden lg:inline">Выйти</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login?next=/profile" className="port-btn port-btn--ghost">
                  <LogIn className="size-3.5" />
                  Вход
                </Link>
                <Link href="/register?next=/profile" className="port-btn port-btn--gold">
                  Регистрация
                </Link>
              </>
            )}

            <time className="port-clock hidden xl:inline">
              {clock || '—'}
            </time>
          </div>
        </div>

        <nav className="port-nav hidden sm:flex" aria-label="Основное меню">
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('port-nav__link', active && 'is-active')}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <nav
          className="flex gap-1.5 overflow-x-auto pb-0.5 sm:hidden"
          aria-label="Мобильное меню"
        >
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('port-nav__link shrink-0', active && 'is-active')}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
