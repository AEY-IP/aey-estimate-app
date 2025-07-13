,соиояяшшлconst fs = require('fs');
const path = require('path');

async function fixSpecificWork() {
  try {
    console.log('🔧 Исправляю конкретную работу с ID 2.02...\n');
    
    // Читаем JSON файл с работами
    const jsonPath = path.join(__dirname, '..', 'data', 'works.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const worksData = JSON.parse(jsonContent);
    
    // Ищем работу с ID 2.02
    const targetWork = worksData.works.find(work => 
      work.description && work.description.includes('ID_AEY: 2.02')
    );
    
    if (!targetWork) {
      console.log('❌ Работа с ID 2.02 не найдена');
      return;
    }
    
    console.log('📋 Найдена работа:');
    console.log(`   Название: ${targetWork.name}`);
    console.log(`   Текущая цена: ${targetWork.basePrice} ₽`);
    
    if (targetWork.basePrice !== 1) {
      console.log('✅ Цена уже корректная!');
      return;
    }
    
    // Исправляем цену
    targetWork.basePrice = 1040;
    
    console.log('🔧 Исправляю цену на 1040 ₽');
    
    // Создаем бэкап
    const backupPath = path.join(__dirname, '..', 'data', `works-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, jsonContent, 'utf-8');
    console.log(`📦 Создан бэкап: ${path.basename(backupPath)}`);
    
    // Сохраняем исправленный файл
    fs.writeFileSync(jsonPath, JSON.stringify(worksData, null, 2), 'utf-8');
    console.log(`✅ Файл обновлен`);
    
    console.log('\n🎉 Исправление завершено!');
    console.log(`💰 Цена изменена: 1 ₽ → 1040 ₽`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

// Запускаем скрипт
if (require.main === module) {
  fixSpecificWork();
}

module.exports = { fixSpecificWork }; 