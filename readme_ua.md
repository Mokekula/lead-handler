# Обробник лідів

Цей інструмент призначений для прийому ліда з Keitaro або іншого фронтенду, виконання операцій з даними ліда та відправки даних у CRM.
В цьому обробнику присутня невелика система логування відповідей, запитів та інших подій.

## Важливо

У проєкті явно не вистачає env-файлу — з зрозумілих причин надати його не можемо, тому використовуйте свій. Ось імена для змінних, деякі з них можуть бути зайвими:

```
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_PASSWORD_ENCODED=
DATABASE_URL=
DATABASE_URL_POSTGRES=
PORT=
LEAD_HANDLER_APP_PORT=
LEAD_HANDLER_FRONTEND_PORT=
VLASNYK_TOKEN=
LEGKOKBBB_TOKEN=
TAIPAN_TOKEN=
ONION_TOKEN=
LONDON_TOKEN=
POOL_TOKEN=
TELEGRAM_BOT_TOKEN=
NODE_ENV=
SMSCLUB_API_KEY=
REACT_APP_PASSWORD=
ROBOTNIK_URL=
ROBOTNIK_GEOIP_URL=
REACT_APP_API_URL=
ALTERCPA_GET_STATUSES_URL=
HUSTLE_TEAM_ROBOTNIK_URL=
```

## Як це працює

- На ендпоінт `/registration` надходять дані (описані в `src/lead.dto.ts`)
- На основі даних створюється лід всередині цього обробника (метод `createLead` у `src/app.service.ts`)
- Якщо лід прийшов з даними для FB (`fb_token` і `pixel`) — відправляємо конверсію у Facebook
- Відправляємо в бот у Telegram сповіщення про нового ліда
- Відправляємо дані в CRM і повертаємо відповідь (найчастіше — автологін)

## Розробка та деплой

### Локально

```sh
1. створити .env файл зі значеннями
2. docker compose -f docker-compose.dev.yml up --build -d
```

## Рефакторинг

**Мета: покращити структуру коду, надійність і безпеку без зміни бізнес-поведінки.** Працюйте невеликими, перевіреними комітами та оновлюйте документацію за потреби.

### Головне

- Замініть власний SHA-256 в `AppService` на Node `crypto` за допомогою невеликого `HashingService`.
- Введіть `ConfigModule` і схему перевірки (наприклад, Joi). Припиніть читати `process.env` безпосередньо в сервісах — замість цього використовуйте `ConfigService`.
- Увімкніть глобальну валідацію: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` в `main.ts`.
- Уніфікуйте рівень серйозності логів: виберіть малі або великі літери для бекенду та фронтенду; відповідно адаптуйте рендеринг інтерфейсу користувача.

### Модуляризація

- Розділіть `AppService` на спеціалізовані сервіси та модулі.
- Зберігайте `AppController` тонким; розгляньте можливість використання `AdminController` для ендпоінтів адміністратора.

### База даних

Очищення схеми Prisma:
- Видалити дублікат `Lead.fullphone` (використовувати `fullPhone`).
- Виправити зв'язок `Logs` з `Lead` (немає `Lead[]` на `Logs`).

### Логи

- Перетворити `Logs.severity` на перелік або стандартизувати до єдиного регістру; додати індекси до `timestamp`, `leadId`, `severity`, `context`.
- Переконайтеся, що відображення рівня серйозності не залежить від регістру або відповідає переліку бекенду.

### Фронтенд

- Замініть `NEXT_PUBLIC_PASSWORD` + `localStorage` на автентифіковані запити (наприклад, Basic Auth, проксі-сервер або простий JWT-потік) для `/api/logs`.

### DevOps (бажано)

- Узгодьте іменування середовищ: бекенд використовує `PORT`; Next.js застосунок використовує `NEXT_PUBLIC_LOGS_URL`. Видаліть невикористані змінні `REACT_APP_*` у compose.
- Існує `compose.dev.yaml` — він призначений для локальної розробки.

## Стек технологій

| Компонент | Технологія |
|---|---|
| Backend Framework | NestJS (v10.0.0) |
| Мова | TypeScript (v5.1.3) |
| ORM | Prisma (v6.5.0) |
| HTTP-клієнт | Axios (v1.8.3) |
| Валідація | class-validator (v0.14.1), class-transformer (v0.5.1) |
| Тестування | Jest (v29.5.0) |
| Пакетний менеджер | npm |

## Структура проєкту

```
/src
├── app.controller.ts   — Головний контролер
├── app.service.ts      — Головний сервіс з логікою обробки лідів
├── lead.dto.ts         — DTO для обробки лідів
├── /logs               — Модуль сервісу логування
└── /prisma             — Сервіс Prisma для роботи з БД
```

## API документація

### Ендпоінти

#### `POST /registration`
- **Призначення:** Обробляє дані реєстрації ліда
- **Контролер:** `AppController.register()`
- **DTO:** `CreateLeadDto`
- **Повертає:** Рядок з результатом обробки

#### `POST /telegram/webhook`
- **Призначення:** Обробляє події вебхука Telegram-бота
- **Контролер:** `AppController.handleTelegramWebhook()`
- **Підтримувані команди:**
  - `/subscribe` — підписує користувача на сповіщення
  - `/unsubscribe` — видаляє користувача зі списку сповіщень
- **Повертає:** JSON зі статусом успіху та повідомленням

## Конфігурація деплою

### Деталі сервера

| Параметр | Значення |
|---|---|
| Порт | 4000 |
| Менеджмент | FastPanel |

### Конфігурація Nginx

Застосунок розгорнуто за Nginx reverse proxy з такою конфігурацією:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

location /registration {
    proxy_pass http://localhost:4000/registration;
    include /etc/nginx/proxy_params;
}
```
