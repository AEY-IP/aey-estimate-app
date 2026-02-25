#!/bin/bash

# Скрипт для создания бэкапа базы данных AEY_APP3
# Использование: ./scripts/create-backup.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Начинаю создание бэкапа...${NC}"

# Создаем папку backups если её нет
mkdir -p backups

# Генерируем timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Загружаем переменные окружения
if [ ! -f .env ]; then
  echo -e "${RED}❌ Файл .env не найден!${NC}"
  exit 1
fi

source .env

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL не установлен в .env${NC}"
  exit 1
fi

# Путь к pg_dump
PG_DUMP_PATH="/Library/PostgreSQL/17/bin/pg_dump"

if [ ! -f "$PG_DUMP_PATH" ]; then
  echo -e "${YELLOW}⚠️  pg_dump не найден по пути $PG_DUMP_PATH${NC}"
  echo -e "${YELLOW}⚠️  Попытка использовать системный pg_dump...${NC}"
  PG_DUMP_PATH="pg_dump"
fi

# Создаем SQL дамп
SQL_BACKUP="backups/backup_${TIMESTAMP}.sql"
echo -e "${YELLOW}📦 Создаю SQL дамп: ${SQL_BACKUP}${NC}"

$PG_DUMP_PATH "$DATABASE_URL" > "$SQL_BACKUP" 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ SQL дамп создан успешно${NC}"
  ls -lh "$SQL_BACKUP"
else
  echo -e "${RED}❌ Ошибка создания SQL дампа${NC}"
  exit 1
fi

# Копируем схему Prisma
SCHEMA_BACKUP="backups/schema_${TIMESTAMP}.prisma"
echo -e "${YELLOW}📋 Копирую схему Prisma: ${SCHEMA_BACKUP}${NC}"

if [ -f "prisma/schema.prisma" ]; then
  cp prisma/schema.prisma "$SCHEMA_BACKUP"
  echo -e "${GREEN}✅ Схема Prisma скопирована${NC}"
else
  echo -e "${YELLOW}⚠️  Схема Prisma не найдена${NC}"
fi

# Статистика
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Бэкап создан успешно!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📁 Расположение: ${YELLOW}$(pwd)/backups/${NC}"
echo ""
echo -e "📊 Файлы:"
echo -e "   • SQL дамп:     ${SQL_BACKUP}"
echo -e "   • Схема Prisma: ${SCHEMA_BACKUP}"
echo ""
echo -e "📈 Размер SQL дампа: $(du -h "$SQL_BACKUP" | cut -f1)"
echo -e "📏 Строк в дампе:    $(wc -l < "$SQL_BACKUP" | tr -d ' ')"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Показываем все бэкапы
echo ""
echo -e "${YELLOW}📚 Все бэкапы в папке:${NC}"
ls -lht backups/*.sql 2>/dev/null | head -5 || echo "Нет SQL бэкапов"

# Опционально: удаление старых бэкапов (старше 30 дней)
# find backups -name "backup_*.sql" -mtime +30 -delete

echo ""
echo -e "${GREEN}🎉 Готово!${NC}"
