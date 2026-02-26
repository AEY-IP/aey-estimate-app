const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function restoreWorks() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Начинаем восстановление работ...')
    
    const worksPath = path.join(__dirname, '../data/works.json')
    if (!fs.existsSync(worksPath)) {
      console.error('❌ Файл works.json не найден!')
      return
    }
    
    const worksData = JSON.parse(fs.readFileSync(worksPath, 'utf8'))
    
    if (!worksData.works || !Array.isArray(worksData.works)) {
      console.error('❌ Неверная структура файла works.json!')
      return
    }
    
    console.log(`📊 Найдено ${worksData.works.length} работ для восстановления`)
    
    const currentWorksCount = await prisma.work.count()
    console.log(`📊 Текущее количество работ в БД: ${currentWorksCount}`)
    
    if (currentWorksCount > 0) {
      console.log('🗑️  Очищаем существующие работы...')
      await prisma.work.deleteMany()
      console.log('✅ Существующие работы удалены')
    }
    
    const batchSize = 100
    let restored = 0
    
    for (let i = 0; i < worksData.works.length; i += batchSize) {
      const batch = worksData.works.slice(i, i + batchSize)
      
      const worksToCreate = batch.map(work => ({
        id: work.id,
        name: work.name,
        unit: work.unit,
        basePrice: work.basePrice,
        category: work.category,
        description: work.description || null,
        parameterId: work.parameterId || null,
        isActive: work.isActive !== false,
        createdAt: work.createdAt ? new Date(work.createdAt) : new Date(),
        updatedAt: work.updatedAt ? new Date(work.updatedAt) : new Date()
      }))
      
      await prisma.work.createMany({
        data: worksToCreate,
        skipDuplicates: true
      })
      
      restored += worksToCreate.length
      console.log(`📝 Восстановлено ${restored}/${worksData.works.length} работ...`)
    }
    
    const finalCount = await prisma.work.count()
    console.log(`✅ Восстановление завершено! Всего работ в БД: ${finalCount}`)
    
    const sampleWorks = await prisma.work.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        category: true,
        basePrice: true,
        unit: true
      }
    })
    
    console.log('\n📋 Примеры восстановленных работ:')
    sampleWorks.forEach(work => {
      console.log(`  • ${work.name} (${work.basePrice} руб/${work.unit}) - ${work.category}`)
    })
    
  } catch (error) {
    console.error('❌ Ошибка восстановления работ:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreWorks()
