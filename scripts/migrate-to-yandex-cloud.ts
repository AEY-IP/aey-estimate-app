import { PrismaClient } from '@prisma/client';
import { uploadFile, downloadFileAsBuffer } from '../src/lib/storage';

const prisma = new PrismaClient();

interface FileRecord {
  id: string;
  filePath: string;
  table: string;
}

async function migrateFiles() {
  console.log('🚀 Начинаем миграцию файлов из Vercel Blob в Yandex Cloud...\n');

  try {
    // Собираем все файлы из разных таблиц
    const allFiles: FileRecord[] = [];

    console.log('📊 Сканируем базу данных...');

    // Photos
    const photos = await prisma.photo.findMany({
      where: {
        filePath: {
          startsWith: 'https://'
        }
      },
      select: { id: true, filePath: true, mimeType: true }
    });
    console.log(`  - Фотографии: ${photos.length}`);
    allFiles.push(...photos.map(p => ({ id: p.id, filePath: p.filePath, table: 'photo', mimeType: p.mimeType })));

    // Documents
    const documents = await prisma.document.findMany({
      where: {
        filePath: {
          startsWith: 'https://'
        }
      },
      select: { id: true, filePath: true, mimeType: true }
    });
    console.log(`  - Документы: ${documents.length}`);
    allFiles.push(...documents.map(d => ({ id: d.id, filePath: d.filePath, table: 'document', mimeType: d.mimeType })));

    // Receipts
    const receipts = await prisma.receipt.findMany({
      where: {
        filePath: {
          startsWith: 'https://'
        }
      },
      select: { id: true, filePath: true, mimeType: true }
    });
    console.log(`  - Чеки: ${receipts.length}`);
    allFiles.push(...receipts.map(r => ({ id: r.id, filePath: r.filePath, table: 'receipt', mimeType: r.mimeType })));

    // Design Project Files
    const designFiles = await prisma.designProjectFile.findMany({
      where: {
        filePath: {
          startsWith: 'https://'
        }
      },
      select: { id: true, filePath: true, mimeType: true }
    });
    console.log(`  - Файлы дизайн-проектов: ${designFiles.length}`);
    allFiles.push(...designFiles.map(f => ({ id: f.id, filePath: f.filePath, table: 'designProjectFile', mimeType: f.mimeType })));

    // Designer Estimate Items
    const designerItems = await prisma.designerEstimateItem.findMany({
      where: {
        imageUrl: {
          not: null,
          startsWith: 'https://'
        }
      },
      select: { id: true, imageUrl: true }
    });
    console.log(`  - Изображения смет дизайнера: ${designerItems.length}`);
    allFiles.push(...designerItems.map(i => ({ id: i.id, filePath: i.imageUrl!, table: 'designerEstimateItem', mimeType: 'image/jpeg' })));

    console.log(`\n📦 Всего файлов для миграции: ${allFiles.length}\n`);

    if (allFiles.length === 0) {
      console.log('✅ Нет файлов для миграции');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i] as any;
      const progress = `[${i + 1}/${allFiles.length}]`;

      try {
        console.log(`${progress} Миграция ${file.table}:${file.id}...`);
        
        // Скачиваем файл из Vercel Blob
        console.log(`  📥 Скачиваем из: ${file.filePath}`);
        const buffer = await downloadFileAsBuffer(file.filePath);
        
        // Извлекаем путь из URL (убираем домен Vercel Blob)
        const urlParts = file.filePath.split('/');
        const blobIndex = urlParts.findIndex((part: string) => part.includes('blob.vercel-storage.com'));
        const key = urlParts.slice(blobIndex + 1).join('/');
        
        console.log(`  📤 Загружаем в YC: ${key}`);
        // Загружаем в Yandex Cloud
        await uploadFile(buffer, key, file.mimeType || 'application/octet-stream', false);
        
        // Обновляем запись в БД
        console.log(`  💾 Обновляем БД...`);
        if (file.table === 'photo') {
          await prisma.photo.update({
            where: { id: file.id },
            data: { filePath: key }
          });
        } else if (file.table === 'document') {
          await prisma.document.update({
            where: { id: file.id },
            data: { filePath: key }
          });
        } else if (file.table === 'receipt') {
          await prisma.receipt.update({
            where: { id: file.id },
            data: { filePath: key }
          });
        } else if (file.table === 'designProjectFile') {
          await prisma.designProjectFile.update({
            where: { id: file.id },
            data: { filePath: key }
          });
        } else if (file.table === 'designerEstimateItem') {
          await prisma.designerEstimateItem.update({
            where: { id: file.id },
            data: { imageUrl: key }
          });
        }
        
        successCount++;
        console.log(`  ✅ Успешно\n`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Ошибка:`, error);
        console.log(`  ⚠️  Файл пропущен\n`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Миграция завершена!`);
    console.log(`   Успешно: ${successCount}`);
    console.log(`   Ошибки: ${errorCount}`);
    console.log(`   Всего: ${allFiles.length}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Критическая ошибка при миграции:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем миграцию
migrateFiles()
  .then(() => {
    console.log('🎉 Скрипт миграции успешно выполнен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Скрипт миграции завершился с ошибкой:', error);
    process.exit(1);
  });
