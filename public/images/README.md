# Структура изображений для сайта

## Папки и их назначение

- **`hero/`** - Изображения для главной секции (hero section) на всех страницах
- **`about/`** - Фотографии для страницы "О нас"
- **`design/`** - Примеры дизайн-проектов
- **`renovation/`** - Фотографии ремонтных работ
- **`team/`** - Фотографии членов команды
- **`portfolio/`** - Портфолио завершенных проектов
- **`icons/`** - Логотипы, иконки, SVG файлы

## Как использовать

### Загрузка изображений
Просто перетащите изображения в нужную папку через Finder или VS Code.

### Использование в коде
```tsx
import Image from 'next/image'

// Для обычных изображений
<Image 
  src="/images/hero/main-banner.jpg" 
  alt="Описание"
  width={1920}
  height={1080}
/>

// Или просто через img тег
<img src="/images/portfolio/project-1.jpg" alt="Проект" />
```

## Рекомендации

### Размеры
- **Hero изображения**: 1920x1080px или больше
- **Портфолио**: 1200x800px
- **Команда (аватарки)**: 400x400px (квадрат)
- **Иконки**: 512x512px (SVG предпочтительнее)

### Форматы
- Фото: `.jpg` или `.webp` (для лучшей производительности)
- Прозрачность: `.png`
- Векторная графика: `.svg`

### Оптимизация
- Используй сервисы типа TinyPNG для сжатия
- Для hero-изображений делай 2 версии: desktop (1920px) и mobile (768px)
- Называй файлы понятно: `hero-main-desktop.jpg`, `team-person-1.jpg`

## Примеры имен файлов

```
hero/
  ├── main-banner.jpg
  ├── about-hero.jpg
  └── design-hero.jpg

portfolio/
  ├── project-1-living-room.jpg
  ├── project-1-kitchen.jpg
  └── project-2-bedroom.jpg

team/
  ├── ceo-avatar.jpg
  ├── designer-avatar.jpg
  └── manager-avatar.jpg
```

