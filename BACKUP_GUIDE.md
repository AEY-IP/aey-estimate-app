# 🗄️ Руководство по бэкапам базы данных

## Создание бэкапа

### Автоматический бэкап через npm
```bash
npm run backup
```

### Ручной запуск скрипта
```bash
node scripts/backup-database.js
```

### Что включается в бэкап
- ✅ Все пользователи и их данные
- ✅ Все клиенты и связанные данные
- ✅ Все сметы со структурой (комнаты, работы, материалы)
- ✅ Все акты со структурой
- ✅ Справочники (работы, коэффициенты, параметры)
- ✅ Документы, фото, чеки
- ✅ Новости проектов и расписание
- ✅ Метаданные и статистика

## Восстановление из бэкапа

### Восстановление последнего бэкапа
```bash
node scripts/restore-from-backup.js
```

### Восстановление конкретного бэкапа
```bash
node scripts/restore-from-backup.js /path/to/backup.json
```

### ⚠️ ВНИМАНИЕ
**Восстановление полностью очищает текущую базу данных!**

## Структура бэкапов

### Расположение файлов
```
backups/
├── backup_2025-06-23_19-53-37-384Z.json          # Обычный бэкап
├── backup_2025-06-23_19-53-37-384Z_compressed.json # Сжатый бэкап
└── ...
```

### Формат файла бэкапа
```json
{
  "metadata": {
    "timestamp": "2025-06-23_19-53-37-384Z",
    "version": "1.0",
    "description": "Полный бэкап базы данных AEY Estimates",
    "createdAt": "2025-06-23T19:53:37.384Z",
    "tables": {
      "users": 2,
      "clients": 5,
      "estimates": 9,
      "estimateRooms": 7,
      "coefficients": 3
    }
  },
  "data": {
    "users": [...],
    "clients": [...],
    "estimates": [...],
    // ... все данные
  }
}
```

## Автоматическая очистка

Скрипт автоматически:
- ✅ Удаляет старые бэкапы (оставляет последние 20 файлов)
- ✅ Создает обычную и сжатую версии
- ✅ Показывает статистику размеров

## Рекомендации

### Частота бэкапов
- 📅 **Ежедневно** - для активной разработки
- 📅 **Перед важными изменениями** - миграции, обновления
- 📅 **Перед деплоем** - обязательно

### Хранение бэкапов
- 💾 **Локально**: в папке `backups/`
- ☁️ **Облако**: копировать в Google Drive, Dropbox и т.д.
- 🗄️ **Сервер**: для продакшена настроить автоматическую загрузку

### Тестирование восстановления
```bash
# 1. Создать бэкап
npm run backup

# 2. Протестировать восстановление на копии
cp backups/latest.json backups/test.json
node scripts/restore-from-backup.js backups/test.json

# 3. Проверить данные
```

## PostgreSQL бэкапы (альтернативный способ)

### Создание SQL дампа
```bash
# Полный дамп
pg_dump $DATABASE_URL > backup.sql

# Только данные
pg_dump --data-only $DATABASE_URL > data_backup.sql

# Только схема
pg_dump --schema-only $DATABASE_URL > schema_backup.sql
```

### Восстановление SQL дампа
```bash
# Восстановление полного дампа
psql $DATABASE_URL < backup.sql

# Только данные
psql $DATABASE_URL < data_backup.sql
```

## Скрипты в package.json

```json
{
  "scripts": {
    "backup": "node scripts/backup-database.js",
    "restore": "node scripts/restore-data.js",
    "restore-backup": "node scripts/restore-from-backup.js"
  }
}
```

## Мониторинг бэкапов

### Проверка последнего бэкапа
```bash
ls -la backups/ | head -5
```

### Размер бэкапов
```bash
du -h backups/
```

### Валидация бэкапа
```bash
node -e "
const backup = require('./backups/latest.json');
console.log('✅ Бэкап валидный');
console.log('📊 Таблиц:', Object.keys(backup.data).length);
console.log('📅 Дата:', backup.metadata.createdAt);
"
```

## Автоматизация

### Cron задача (Linux/Mac)
```bash
# Ежедневный бэкап в 2:00
0 2 * * * cd /path/to/project && npm run backup
```

### GitHub Actions
```yaml
name: Daily Backup
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run backup
      - uses: actions/upload-artifact@v2
        with:
          name: database-backup
          path: backups/
```

## Восстановление в экстренных ситуациях

### Быстрое восстановление
```bash
# 1. Остановить приложение
# 2. Восстановить последний бэкап
npm run restore-backup
# 3. Запустить приложение
npm run dev
```

### Частичное восстановление
Для восстановления только определенных таблиц можно отредактировать скрипт `restore-from-backup.js` и закомментировать ненужные части.

## Проблемы и решения

### "Файл бэкапа не найден"
- Проверьте путь к файлу
- Убедитесь что папка `backups/` существует

### "Неверный формат файла"
- Проверьте что файл не поврежден
- Убедитесь что это файл из нашего скрипта бэкапа

### "Ошибка подключения к БД"
- Проверьте переменную `DATABASE_URL`
- Убедитесь что PostgreSQL запущен

### Большой размер бэкапов
- Используйте сжатые версии (`*_compressed.json`)
- Настройте архивацию старых бэкапов
- Исключите ненужные таблицы из бэкапа 