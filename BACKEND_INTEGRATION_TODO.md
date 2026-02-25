# 🔗 Интеграция мобильного приложения с бэкендом

## Что нужно сделать в веб-приложении

### 1. Обновить Prisma Schema

**Файл:** `prisma/schema.prisma`

```prisma
// Добавить роль WORKER
enum UserRole {
  ADMIN
  MANAGER
  DESIGNER
  FOREMAN
  WORKER  // ← новое
}

// Новая модель: Рабочий
model Worker {
  id        String   @id @default(cuid())
  name      String
  pin       String   @unique // 6-значный PIN
  phone     String?
  clientId  String   // привязка к объекту/клиенту
  client    Client   @relation(fields: [clientId], references: [id])
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("workers")
}

// Новая модель: Технологическая карта
model TechnicalCard {
  id          String   @id @default(cuid())
  title       String
  description String   @db.Text
  category    String   // Полы, Стены, Потолки и т.д.
  steps       Json?    // Массив шагов [{step: "...", description: "..."}]
  images      String[] // Массив путей к изображениям
  videoUrl    String?  // URL видео (опционально)
  tags        String[] // Теги для фильтрации ["черновая", "чистовая"]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("technical_cards")
}

// Обновить модель Client (добавить связь с рабочими)
model Client {
  // ... существующие поля
  workers   Worker[]  // ← добавить
}
```

**После изменений выполнить:**

```bash
npx prisma migrate dev --name add_workers_and_technical_cards
npx prisma generate
```

---

### 2. Создать API endpoints

**Структура API:**

```
src/app/api/
├── auth/
│   └── worker/
│       └── route.ts         # POST - авторизация по PIN
├── workers/
│   ├── route.ts             # GET - список, POST - создать
│   └── [id]/
│       └── route.ts         # GET, PATCH, DELETE
└── technical-cards/
    ├── route.ts             # GET - список, POST - создать
    └── [id]/
        └── route.ts         # GET, PATCH, DELETE
```

---

### 3. API Endpoint: Авторизация рабочего

**Файл:** `src/app/api/auth/worker/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    // Валидация
    if (!pin || pin.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат PIN' },
        { status: 400 }
      )
    }

    // Поиск рабочего
    const worker = await prisma.worker.findUnique({
      where: { pin },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            address: true,
          }
        }
      }
    })

    if (!worker || !worker.isActive) {
      return NextResponse.json(
        { success: false, error: 'Неверный PIN или рабочий неактивен' },
        { status: 401 }
      )
    }

    // Возврат данных рабочего
    return NextResponse.json({
      success: true,
      worker: {
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        pin: worker.pin,
        clientId: worker.clientId,
        clientName: worker.client?.name,
        objectAddress: worker.client?.address,
        createdAt: worker.createdAt.toISOString(),
      }
    })
  } catch (error) {
    console.error('Worker auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
```

---

### 4. API Endpoint: Получить техкарты

**Файл:** `src/app/api/technical-cards/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')
    const category = searchParams.get('category')

    // TODO: В будущем фильтровать по признакам объекта
    const cards = await prisma.technicalCard.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: {
        title: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      cards: cards.map(card => ({
        id: card.id,
        title: card.title,
        description: card.description,
        category: card.category,
        steps: card.steps,
        images: card.images,
        videoUrl: card.videoUrl,
        tags: card.tags,
        createdAt: card.createdAt.toISOString(),
      }))
    })
  } catch (error) {
    console.error('Get cards error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Добавить проверку авторизации (только ADMIN/MANAGER)
    const data = await request.json()

    const card = await prisma.technicalCard.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        steps: data.steps || null,
        images: data.images || [],
        videoUrl: data.videoUrl || null,
        tags: data.tags || [],
      }
    })

    return NextResponse.json({ success: true, card })
  } catch (error) {
    console.error('Create card error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка создания' },
      { status: 500 }
    )
  }
}
```

---

### 5. API Endpoint: Детали техкарты

**Файл:** `src/app/api/technical-cards/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const card = await prisma.technicalCard.findUnique({
      where: { id: params.id }
    })

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Карта не найдена' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, card })
  } catch (error) {
    console.error('Get card error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
```

---

### 6. Добавить UI для управления рабочими

**Страница:** `src/app/app/workers/page.tsx`

Функционал:
- Список всех рабочих
- Создать нового рабочего
- Генерация PIN-кода (случайный 6-значный)
- Привязка рабочего к объекту/клиенту
- Деактивация рабочего

---

### 7. Добавить UI для управления техкартами

**Страница:** `src/app/app/technical-cards/page.tsx`

Функционал:
- Список всех техкарт
- Создать новую техкарту
- Редактировать техкарту
- Загрузка фото/видео
- Управление этапами работ
- Теги и категории

---

### 8. Обновить мобильное приложение

**Файл:** `mobile/src/services/api.ts`

Изменить `API_BASE_URL`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3004/api'           // для разработки
  : 'https://your-domain.vercel.app/api'  // для продакшена
```

---

## Порядок реализации

### Этап 1: База данных (2-3 часа)

1. ✅ Обновить Prisma schema
2. ✅ Выполнить миграцию
3. ✅ Создать seed данные для тестирования

### Этап 2: API (3-4 часа)

1. ✅ Создать endpoint авторизации рабочих
2. ✅ Создать CRUD для техкарт
3. ✅ Протестировать через Postman/Thunder Client

### Этап 3: UI в веб-приложении (4-5 часов)

1. ✅ Страница управления рабочими
2. ✅ Страница управления техкартами
3. ✅ Загрузка медиа файлов

### Этап 4: Интеграция с мобильным приложением (1-2 часа)

1. ✅ Обновить API URLs
2. ✅ Протестировать авторизацию
3. ✅ Протестировать загрузку данных

---

## Тестовые данные для seed

**Файл:** `prisma/seed.ts`

```typescript
// Создать тестового рабочего
await prisma.worker.create({
  data: {
    name: 'Иван Петров',
    pin: '123456',
    phone: '+7 999 123-45-67',
    clientId: 'existing-client-id', // ID существующего клиента
  }
})

// Создать техкарты
const cards = [
  {
    title: 'Устройство стяжки пола',
    description: 'Технология устройства цементно-песчаной стяжки...',
    category: 'Полы',
    tags: ['пол', 'стяжка', 'черновая'],
    steps: [
      'Подготовка основания',
      'Установка маяков',
      // ...
    ]
  },
  // ... остальные карты
]

for (const card of cards) {
  await prisma.technicalCard.create({ data: card })
}
```

---

## Проверка интеграции

### 1. Тест авторизации

```bash
curl -X POST http://localhost:3004/api/auth/worker \
  -H "Content-Type: application/json" \
  -d '{"pin":"123456"}'
```

Ожидаемый ответ:
```json
{
  "success": true,
  "worker": {
    "id": "...",
    "name": "Иван Петров",
    "clientName": "ЖК Level Нагатинская"
  }
}
```

### 2. Тест получения техкарт

```bash
curl http://localhost:3004/api/technical-cards
```

Ожидаемый ответ:
```json
{
  "success": true,
  "cards": [...]
}
```

---

## Готово к продакшену

После реализации всех шагов:

1. ✅ Рабочие могут авторизоваться через мобильное приложение
2. ✅ Менеджеры управляют рабочими через веб-приложение
3. ✅ Техкарты синхронизируются между платформами
4. ✅ Готово к деплою на Vercel

---

## Следующие улучшения

- 🔐 JWT токены для авторизации
- 📥 Офлайн кэширование в мобильном приложении
- 📊 Аналитика: какие карты чаще смотрят
- 🔔 Push уведомления для рабочих
- 📍 Признаки объектов для фильтрации техкарт
