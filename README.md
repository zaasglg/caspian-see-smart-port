# Caspian Smart Port AI

Ситуационный центр порта Актау: карта, AI-назначение причалов, алерты, live-погода и личный флот оператора.

## Требования

- **Node.js** 20+
- **npm**
- **MySQL** (например MAMP) на порту `8889`
- база данных `hackathon`

## Быстрый старт

### 1. Установите зависимости

```bash
npm install
```

### 2. Настройте окружение

```bash
cp .env.example .env.local
```

Проверьте `.env.local`:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=8889
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=hackathon
AUTH_SECRET=caspian-hackathon-change-me
```

### 3. База данных MySQL

Убедитесь, что MySQL слушает порт **8889**, пользователь `root` / пароль `root`.

Можно импортировать готовый дамп [`hackathon.sql`](./hackathon.sql) — в нём схема таблиц `users` / `vessels` и примерные данные.

**Через терминал:**

```bash
# создать базу (если ещё нет)
mysql -h 127.0.0.1 -P 8889 -u root -proot -e "CREATE DATABASE IF NOT EXISTS hackathon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# импортировать дамп
mysql -h 127.0.0.1 -P 8889 -u root -proot hackathon < hackathon.sql
```

**Через phpMyAdmin (MAMP):**

1. Откройте phpMyAdmin → база `hackathon` (или создайте её).
2. Вкладка **Import** / **Импорт**.
3. Выберите файл `hackathon.sql` → **Go** / **Вперёд**.

Если дамп не импортировать, таблицы `users` и `vessels` всё равно создадутся автоматически при первом запросе к API (без seed-данных).

### 4. Запустите приложение

```bash
npm run dev
```

Откройте: [http://localhost:3000](http://localhost:3000)

Если порт занят, Next.js может стартовать на `3001` — смотрите вывод терминала.

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production-сборка |
| `npm start` | Запуск после `build` |
| `npm run lint` | ESLint |

## Страницы

| URL | Доступ | Описание |
|---|---|---|
| `/` | Гость | Обзор, KPI |
| `/map` | Гость | Карта порта |
| `/schedule` | Гость | Расписание |
| `/berths` | Гость | Причалы |
| `/alerts` | Гость | Алерты |
| `/login` | Публично | Вход |
| `/register` | Публично | Регистрация |
| `/profile` | Только после входа | Добавление судов, свой флот |

Гости видят карту и AI-сценарий. Добавлять суда можно только в **Профиле** после регистрации.

## Стек

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Leaflet (карта)
- MySQL (`mysql2`)
- Open-Meteo (погода Актау)

## Полезные заметки

- Для инициализации БД удобно использовать [`hackathon.sql`](./hackathon.sql).
- Сессия хранится в httpOnly cookie (`AUTH_SECRET`).
- Флот каждого пользователя хранится в MySQL и привязан к аккаунту.
- Погода берётся live с Open-Meteo; шторм определяется автоматически при ветре выше порога.
