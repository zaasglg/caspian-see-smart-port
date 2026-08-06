'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { usePort } from '@/context/PortContext';
import { PORT_META } from '@/data/portData';

export function DataSourcesCard() {
  const { vessels, isGuest } = usePort();
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Источники данных</CardTitle>
        <CardDescription>
          {PORT_META.name} · UN/LOCODE {PORT_META.unlocode}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge>Погода · live</Badge>
          <Badge>
            {isGuest
              ? `Гость · флот ${vessels.length}`
              : `${user?.name ?? 'Оператор'} · флот ${vessels.length}`}
          </Badge>
          <Badge variant="outline">Порт Актау · KZAAU</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {isGuest ? (
            <>
              Карта, KPI и расписание доступны без входа. Чтобы вести свой флот —
              откройте{' '}
              <Link
                href="/register?next=/profile"
                className="underline underline-offset-2"
              >
                профиль
              </Link>
              .
            </>
          ) : (
            <>
              Флот аккаунта {user?.email}. Управление судами — в разделе
              «Профиль».
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
