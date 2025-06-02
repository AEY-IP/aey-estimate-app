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

async function debugSpecificWork() {
  try {
    console.log('🔍 Отладка конкретной работы...\n');
    
    // Читаем CSV файл
    const csvPath = path.join(__dirname, '..', 'Справочник работ.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvData = parseCSV(csvContent);
    
    // Читаем JSON файл с работами
    const jsonPath = path.join(__dirname, '..', 'data', 'works.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const worksData = JSON.parse(jsonContent);
    
    // Ищем работу с механизированной штукатуркой с ID 2.02
    const targetWork = worksData.works.find(work => 
      work.description && work.description.includes('ID_AEY: 2.02')
    );
    
    if (!targetWork) {
      console.log('❌ Работа не найдена в JSON');
      return;
    }
    
    console.log('📋 Информация о работе в JSON:');
    console.log(`   Название: ${targetWork.name}`);
    console.log(`   Цена: ${targetWork.basePrice}`);
    console.log(`   Описание: ${targetWork.description}`);
    
    // Извлекаем ID из описания
    const idMatch = targetWork.description?.match(/ID_AEY:\s*([0-9.]+)/);
    if (!idMatch) {
      console.log('❌ ID_AEY не найден в описании');
      return;
    }
    
    const jsonId = idMatch[1].trim();
    const normalizedJsonId = normalizeId(jsonId);
    
    console.log(`   JSON ID: ${jsonId}`);
    console.log(`   Нормализованный ID: ${normalizedJsonId}\n`);
    
    // Ищем в CSV
    console.log('🔍 Поиск в CSV...');
    
    // Создаем карту CSV данных
    const csvMap = new Map();
    csvData.forEach(row => {
      if (row.ID_AEY) {
        const normalizedId = normalizeId(row.ID_AEY);
        csvMap.set(normalizedId, row);
        csvMap.set(row.ID_AEY.trim(), row);
      }
    });
    
    console.log(`   Всего записей в CSV карте: ${csvMap.size}`);
    
    // Ищем прямое совпадение
    let csvRow = csvMap.get(jsonId);
    console.log(`   Прямое совпадение по ID "${jsonId}": ${csvRow ? 'НАЙДЕНО' : 'НЕ НАЙДЕНО'}`);
    
    if (!csvRow) {
      csvRow = csvMap.get(normalizedJsonId);
      console.log(`   Совпадение по нормализованному ID "${normalizedJsonId}": ${csvRow ? 'НАЙДЕНО' : 'НЕ НАЙДЕНО'}`);
    }
    
    if (csvRow) {
      console.log('\n📋 Информация о записи в CSV:');
      console.log(`   CSV ID: ${csvRow.ID_AEY}`);
      console.log(`   Название: ${csvRow.KIND}`);
      console.log(`   Цена: ${csvRow.PRICE}`);
      console.log(`   Единицы: ${csvRow.MES}`);
      
      console.log('\n🔧 Результат сравнения:');
      console.log(`   JSON цена: ${targetWork.basePrice}`);
      console.log(`   CSV цена: ${csvRow.PRICE}`);
      console.log(`   Нужно исправление: ${targetWork.basePrice === 1 && csvRow.PRICE > 100 ? 'ДА' : 'НЕТ'}`);
    } else {
      console.log('\n❌ Запись в CSV не найдена');
      
      // Покажем похожие записи
      console.log('\n🔍 Поиск похожих записей в CSV:');
      const similarRecords = csvData.filter(row => 
        row.KIND && row.KIND.toLowerCase().includes('штукатур')
      ).slice(0, 5);
      
      similarRecords.forEach(record => {
        console.log(`   ID: ${record.ID_AEY} - ${record.KIND} - ${record.PRICE} ₽`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

// Запускаем отладку
if (require.main === module) {
  debugSpecificWork();
}

module.exports = { debugSpecificWork }; 