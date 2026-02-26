const fs = require('fs');
const path = require('path');

// Функция для парсинга цены из CSV (обрабатывает формат " 1,040 ")
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
  const header = lines[0].split(',');
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
    values.push(current.trim()); // Добавляем последнее значение
    
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

// Функция для нормализации ID (убирает концевые нули)
function normalizeId(id) {
  if (!id) return '';
  return id.toString().replace(/\.0+$/, '').trim();
}

async function fixWorkPrices() {
  try {
    console.log('🔧 Начинаем исправление цен в справочнике работ...\n');
    
    // Читаем CSV файл
    console.log('📖 Читаем CSV файл...');
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
        // Также добавляем оригинальный ID
        csvMap.set(row.ID_AEY.trim(), row);
      }
    });
    
    console.log('🔍 Ищем расхождения в ценах...\n');
    
    let fixedCount = 0;
    const fixes = [];
    
    // Проходим по всем работам в JSON
    for (const work of worksData.works) {
      // Извлекаем ID_AEY из описания (формат: "ID_AEY: 2.009")
      const idMatch = work.description?.match(/ID_AEY:\s*([0-9.]+)/);
      if (!idMatch) continue;
      
      const idAEY = idMatch[1].trim();
      const normalizedIdAEY = normalizeId(idAEY);
      
      // Ищем в обеих версиях ID
      let csvRow = csvMap.get(idAEY) || csvMap.get(normalizedIdAEY);
      
      if (!csvRow) continue;
      
      // Проверяем, если в JSON цена равна 1, а в CSV больше 100
      if (work.basePrice === 1 && csvRow.PRICE > 100) {
        fixes.push({
          workId: work.id,
          name: work.name,
          currentPrice: work.basePrice,
          correctPrice: csvRow.PRICE,
          idAEY: idAEY,
          csvIdAEY: csvRow.ID_AEY
        });
        
        // Исправляем цену
        work.basePrice = csvRow.PRICE;
        fixedCount++;
        
        console.log(`🔧 Исправлено: "${work.name}"`);
        console.log(`   JSON ID: ${idAEY} → CSV ID: ${csvRow.ID_AEY}`);
        console.log(`   Было: ${1} ₽ → Стало: ${csvRow.PRICE} ₽\n`);
      }
    }
    
    if (fixedCount === 0) {
      console.log('✅ Проблемных цен не найдено! Все цены корректны.\n');
      return;
    }
    
    // Сохраняем исправленный JSON
    console.log(`💾 Сохраняем исправления... (${fixedCount} записей)`);
    
    // Создаем бэкап
    const backupPath = path.join(__dirname, '..', 'data', `works-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, jsonContent, 'utf-8');
    console.log(`📦 Создан бэкап: ${path.basename(backupPath)}`);
    
    // Сохраняем исправленный файл
    fs.writeFileSync(jsonPath, JSON.stringify(worksData, null, 2), 'utf-8');
    console.log(`✅ Файл ${path.basename(jsonPath)} обновлен`);
    
    // Создаем отчет
    const reportPath = path.join(__dirname, '..', `price-fixes-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      totalFixed: fixedCount,
      fixes: fixes
    }, null, 2), 'utf-8');
    console.log(`📊 Создан отчет: ${path.basename(reportPath)}\n`);
    
    console.log('🎉 Исправление завершено успешно!');
    console.log(`📈 Статистика:`);
    console.log(`   • Исправлено цен: ${fixedCount}`);
    console.log(`   • Общая сумма исправлений: ${fixes.reduce((sum, fix) => sum + (fix.correctPrice - fix.currentPrice), 0).toLocaleString('ru-RU')} ₽`);
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении цен:', error);
    process.exit(1);
  }
}

// Запускаем скрипт
if (require.main === module) {
  fixWorkPrices();
}

module.exports = { fixWorkPrices, parsePrice }; 