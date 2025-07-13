const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function restoreWorksWithBlocks() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Восстанавливаем работы с блоками...');
    
    const worksData = JSON.parse(fs.readFileSync('data/works.json', 'utf8'));
    console.log('📋 Загружены работы:', worksData.works.length);
    
    // Получаем все уникальные категории
    const categories = [...new Set(worksData.works.map(work => work.category))];
    console.log('📊 Уникальных категорий:', categories.length);
    
    // Очищаем таблицы
    await prisma.workItem.deleteMany({});
    await prisma.workBlock.deleteMany({});
    console.log('🗑️ Таблицы очищены');
    
    // Создаем блоки для каждой категории
    const blockMap = new Map();
    
    for (const category of categories) {
      const block = await prisma.workBlock.create({
        data: {
          title: category,
          description: `Блок работ: ${category}`,
          isActive: true
        }
      });
      blockMap.set(category, block.id);
      console.log(`✅ Создан блок: ${category}`);
    }
    
    console.log('📦 Всего блоков создано:', blockMap.size);
    
    // Теперь создаем работы с привязкой к блокам
    const batchSize = 100;
    let restored = 0;
    
    for (let i = 0; i < worksData.works.length; i += batchSize) {
      const batch = worksData.works.slice(i, i + batchSize);
      
      const dataToInsert = batch.map(work => ({
        id: work.id,
        name: work.name,
        unit: work.unit,
        price: work.basePrice,
        description: work.description || '',
        parameterId: work.parameterId || null,
        blockId: blockMap.get(work.category), // Привязываем к блоку
        isActive: work.isActive !== false,
        createdAt: new Date(work.createdAt),
        updatedAt: new Date(work.updatedAt)
      }));
      
      await prisma.workItem.createMany({
        data: dataToInsert
      });
      
      restored += batch.length;
      console.log(`✅ Восстановлено ${restored}/${worksData.works.length} работ`);
    }
    
    const workCount = await prisma.workItem.count();
    const blockCount = await prisma.workBlock.count();
    
    console.log('🎉 Восстановление завершено!');
    console.log('📊 Блоков:', blockCount);
    console.log('📊 Работ:', workCount);
    
    // Пример работы
    const sample = await prisma.workItem.findFirst({
      include: { block: true },
      select: { 
        id: true, 
        name: true, 
        unit: true, 
        price: true,
        block: { select: { title: true } }
      }
    });
    console.log('📋 Пример работы:', JSON.stringify(sample, null, 2));
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error('Детали:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreWorksWithBlocks();
