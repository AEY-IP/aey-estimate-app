# 🚀 Руководство по развертыванию приложения AEY Estimates

## Этап 1: Подготовка к развертыванию

### 1.1 Установка зависимостей
```bash
npm install
```

### 1.2 Настройка переменных окружения
Создайте файл `.env` в корне проекта:

```env
# База данных
DATABASE_URL="postgresql://username:password@localhost:5432/aey_estimates?schema=public"

# Аутентификация
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Для продакшена
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Файловое хранилище (Vercel Blob)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

## Этап 2: Настройка базы данных

### 2.1 Создание базы данных PostgreSQL

#### Вариант A: Supabase (рекомендуется)
1. Зайдите на https://supabase.com
2. Создайте новый проект
3. Скопируйте строку подключения в `DATABASE_URL`

#### Вариант B: Railway
1. Зайдите на https://railway.app
2. Создайте новый проект с PostgreSQL
3. Скопируйте строку подключения

### 2.2 Инициализация базы данных
```bash
# Генерация Prisma Client
npm run db:generate

# Создание миграций
npm run db:migrate

# Заполнение данными из JSON
npm run db:seed
```

## Этап 3: Миграция данных

### 3.1 Автоматическая миграция
Скрипт `prisma/seed.ts` автоматически перенесет данные из JSON файлов:
- Пользователи из `data/users.json`
- Работы из `data/works.json` 
- Клиенты из `data/clients.json`
- Сметы из `data/estimates.json`
- Коэффициенты из `data/coefficients.json`
- Параметры помещений из `data/room-parameters.json`

### 3.2 Проверка миграции
```bash
# Проверка количества записей
npx prisma studio
```

## Этап 4: Развертывание на Vercel

### 4.1 Подключение к Git
```bash
git add .
git commit -m "Готово к развертыванию"
git push origin main
```

### 4.2 Настройка Vercel
1. Зайдите на https://vercel.com
2. Импортируйте проект из GitHub
3. Добавьте переменные окружения:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `BLOB_READ_WRITE_TOKEN`

### 4.3 Настройка автодеплоя
При каждом push в `main` ветку приложение будет автоматически обновляться.

## Этап 5: Многопользовательская архитектура

### 5.1 Изоляция данных пользователей
- Каждый пользователь видит только свои сметы
- Клиенты привязаны к создавшему их пользователю
- Работы и коэффициенты общие для всех

### 5.2 Роли пользователей
- **ADMIN**: Полный доступ, управление пользователями
- **MANAGER**: Создание смет, управление клиентами

## Этап 6: Система обновлений

### 6.1 CI/CD через Vercel
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 6.2 Обновление справочника работ
```bash
# Скрипт для обновления цен
node scripts/sync-all-prices.js
```

## Этап 7: Мониторинг и резервное копирование

### 7.1 Автоматические бэкапы БД
Настройте ежедневные бэкапы через PostgreSQL:
```sql
-- Создание бэкапа
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 7.2 Мониторинг ошибок
Интегрируйте Sentry для отслеживания ошибок:
```bash
npm install @sentry/nextjs
```

## Этап 8: Безопасность

### 8.1 Настройка HTTPS
Vercel автоматически предоставляет SSL сертификаты.

### 8.2 Аутентификация
- JWT токены для сессий
- Bcrypt для хеширования паролей
- Middleware для защиты API роутов

## Этап 9: Файловое хранилище

### 9.1 Vercel Blob для файлов
- CSV импорт/экспорт
- HTML сметы
- Изображения (если нужно)

### 9.2 Пример использования
```typescript
import { put } from '@vercel/blob'

// Сохранение файла
const blob = await put('filename.csv', file, {
  access: 'public',
})
```

## Этап 10: Масштабирование

### 10.1 Кеширование
- Redis для кеширования справочников
- Vercel Edge для статических ресурсов

### 10.2 Оптимизация БД
```sql
-- Индексы для быстрого поиска
CREATE INDEX idx_work_items_category ON work_items(category);
CREATE INDEX idx_estimates_client ON estimates(client_id);
```

## Чеклист готовности к запуску

- [ ] База данных настроена
- [ ] Данные мигрированы
- [ ] Переменные окружения добавлены
- [ ] Приложение развернуто на Vercel
- [ ] SSL сертификат активен
- [ ] Тестовый пользователь создан
- [ ] Резервное копирование настроено
- [ ] Мониторинг подключен

## Поддержка и обновления

### Как обновлять приложение:
1. Внесите изменения в код
2. Сделайте `git push`
3. Vercel автоматически развернет обновления
4. Пользователи получат обновления мгновенно

### Как обновлять справочники:
1. Загрузите новый CSV через интерфейс
2. Или запустите скрипт синхронизации
3. Изменения сразу доступны всем пользователям

---

**Результат:** Ваше приложение станет доступно по ссылке `https://your-app.vercel.app` для всех пользователей интернета с автоматическими обновлениями и надежным хранением данных. 