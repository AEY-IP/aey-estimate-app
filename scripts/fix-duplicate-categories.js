const { PrismaClient } = require('@prisma/client')

async function fixDuplicateCategories() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Исправление дублированных категорий работ...')
    
    // Получаем все работы
    const works = await prisma.work.findMany({
      select: {
        id: true,
        category: true
      }
    })
    
    console.log(`📋 Всего работ: ${works.length}`)
    
    let fixed = 0
    
    // Нормализуем категории (убираем лишние пробелы)
    for (const work of works) {
      const trimmed = work.category.trim()
      if (work.category !== trimmed) {
        await prisma.work.update({
          where: { id: work.id },
          data: { category: trimmed }
        })
        fixed++
      }
    }
    
    console.log(`✅ Исправлено работ: ${fixed}`)
    
    // Показываем статистику по категориям
    const categories = await prisma.work.findMany({
      select: { category: true },
      distinct: ['category']
    })
    
    console.log(`📊 Уникальных категорий: ${categories.length}`)
    
    // Проверяем демонтажные работы
    const demontageCategories = await prisma.work.findMany({
      where: {
        category: {
          contains: 'Демонтажные'
        }
      },
      select: { category: true },
      distinct: ['category']
    })
    
    console.log('\n📂 Демонтажные категории:')
    for (const cat of demontageCategories) {
      const count = await prisma.work.count({
        where: { category: cat.category }
      })
      console.log(`  • ${cat.category} - ${count} работ`)
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDuplicateCategories()
