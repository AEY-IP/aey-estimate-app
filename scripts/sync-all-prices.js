const fs = require('fs');
const path = require('path');

// Функция для парсинга цены из CSV 
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  
  // Убираем пробелы и кавычки
  const cleaned = priceStr.toString().trim().replace(/"/g, '');
  
  // Если цена содержит запятую как разделитель тысяч (например "1,040")
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Убираем запятые и парсим как целое число
    return parseInt(cleaned.replace(/,/g, ''), 10);
  }
  
  // Если цена содержит точку как десятичный разделитель
  if (cleaned.includes('.')) {
    return parseFloat(cleaned);
  }
  
  // Обычное целое число
  return parseInt(cleaned, 10) || 0;
}

// Функция для чтения и парсинга CSV файла
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Простой парсинг CSV с учетом кавычек
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length >= 6) {
      const row = {
        ID_AEY: values[0]?.trim(),
        ID_PRIMARY: values[1]?.trim(),
        CLASS: values[2]?.trim(),
        KIND: values[3]?.trim(),
        MES: values[4]?.trim(),
        PRICE: parsePrice(values[5])
      };
      
      data.push(row);
    }
  }
  
  return data;
}

// Функция для нормализации ID
function normalizeId(id) {
  if (!id) return '';
  return id.toString().replace(/\.0+$/, '').trim();
}

async function syncAllPrices() {
  try {
    console.log('🔄 Синхронизируем ВСЕ цены из CSV в JSON...\n');
    
    // Читаем CSV файл
    console.log('📖 Читаем обновленный CSV файл...');
    const csvPath = path.join(__dirname, '..', 'Справочник работ.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvData = parseCSV(csvContent);
    console.log(`✅ Прочитано ${csvData.length} записей из CSV\n`);
    
    // Читаем JSON файл с работами
    console.log('📖 Читаем JSON файл с работами...');
    const jsonPath = path.join(__dirname, '..', 'data', 'works.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const worksData = JSON.parse(jsonContent);
    console.log(`✅ Прочитано ${worksData.works.length} записей из JSON\n`);
    
    // Создаем карту CSV данных по ID для быстрого поиска
    const csvMap = new Map();
    csvData.forEach(row => {
      if (row.ID_AEY) {
        const normalizedId = normalizeId(row.ID_AEY);
        csvMap.set(normalizedId, row);
        csvMap.set(row.ID_AEY.trim(), row);
      }
    });
    
    console.log('🔄 Синхронизируем цены...\n');
    
    let syncedCount = 0;
    let unchangedCount = 0;
    const syncs = [];
    
    // Проходим по всем работам в JSON
    for (const work of worksData.works) {
      // Извлекаем ID_AEY из описания
      const idMatch = work.description?.match(/ID_AEY:\s*([0-9.]+)/);
      if (!idMatch) {
        console.log(`⚠️  Пропускаем: "${work.name}" - нет ID_AEY`);
        continue;
      }
      
      const idAEY = idMatch[1].trim();
      const normalizedIdAEY = normalizeId(idAEY);
      
      // Ищем в обеих версиях ID
      let csvRow = csvMap.get(idAEY) || csvMap.get(normalizedIdAEY);
      
      if (!csvRow) {
        console.log(`❌ Не найдено в CSV: "${work.name}" (ID: ${idAEY})`);
        continue;
      }
      
      // Сравниваем цены
      const oldPrice = work.basePrice;
      const newPrice = csvRow.PRICE;
      
      if (oldPrice !== newPrice) {
        syncs.push({
          workId: work.id,
          name: work.name,
          oldPrice: oldPrice,
          newPrice: newPrice,
          idAEY: idAEY,
          csvIdAEY: csvRow.ID_AEY
        });
        
        // Обновляем цену
        work.basePrice = newPrice;
        syncedCount++;
        
        console.log(`🔄 Обновлено: "${work.name}"`);
        console.log(`   ID: ${idAEY} | ${oldPrice} ₽ → ${newPrice} ₽\n`);
      } else {
        unchangedCount++;
      }
    }
    
    if (syncedCount === 0) {
      console.log('✅ Все цены уже актуальны! Синхронизация не требуется.\n');
      return;
    }
    
    // Сохраняем обновленный JSON
    console.log(`💾 Сохраняем изменения... (${syncedCount} обновлений)`);
    
    // Создаем бэкап
    const backupPath = path.join(__dirname, '..', 'data', `works-backup-sync-${Date.now()}.json`);
    fs.writeFileSync(backupPath, jsonContent, 'utf-8');
    console.log(`📦 Создан бэкап: ${path.basename(backupPath)}`);
    
    // Сохраняем обновленный файл
    fs.writeFileSync(jsonPath, JSON.stringify(worksData, null, 2), 'utf-8');
    console.log(`✅ Файл ${path.basename(jsonPath)} обновлен`);
    
    // Создаем отчет
    const reportPath = path.join(__dirname, '..', `price-sync-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalSynced: syncedCount,
      totalUnchanged: unchangedCount,
      syncs: syncs
    }, null, 2), 'utf-8');
    console.log(`📊 Создан отчет: ${path.basename(reportPath)}\n`);
    
    console.log('🎉 Синхронизация завершена успешно!');
    console.log(`📈 Статистика:`);
    console.log(`   • Обновлено цен: ${syncedCount}`);
    console.log(`   • Без изменений: ${unchangedCount}`);
    console.log(`   • Общий перепад цен: ${syncs.reduce((sum, sync) => sum + Math.abs(sync.newPrice - sync.oldPrice), 0).toLocaleString('ru-RU')} ₽`);
    
  } catch (error) {
    console.error('❌ Ошибка при синхронизации:', error);
    process.exit(1);
  }
}

// Запускаем скрипт
if (require.main === module) {
  syncAllPrices();
}

module.exports = { syncAllPrices }; 