const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function restoreWorks() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Восстанавливаю работы...')
    
    // Проверяем текущее количество работ
    const currentCount = await prisma.work.count()
    console.log(`📊 Текущее количество работ: ${currentCount}`)
    
    if (currentCount > 0) {
      console.log('✅ Работы уже есть в базе')
      return
    }
    
    // Читаем файл с работами
    const worksPath = path.join(__dirname, '../data/works.json')
    const worksData = JSON.parse(fs.readFileSync(worksPath, 'utf8'))
    
    console.log(`📋 Найдено ${worksData.works.length} работ`)
    
    // Создаем работы небольшими порциями
    const batchSize = 50
    let created = 0
    
    for (let i = 0; i < worksData.works.length; i += batchSize) {
      const batch = worksData.works.slice(i, i + batchSize)
      
      for (const work of batch) {
        try {
          await prisma.work.create({
            data: {
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
            }
          })
          created++
        } catch (error) {
          console.log(`❌ Ошибка с работой ${work.name}: ${error.message}`)
        }
      }
      
      console.log(`📝 Создано ${created}/${worksData.works.length} работ...`)
    }
    
    console.log(`✅ Восстановление завершено! Создано ${created} работ`)
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreWorks()
