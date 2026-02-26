const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

async function restoreRoomParameters() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Восстанавливаю параметры помещений...')
    
    // Проверяем текущее количество параметров
    const currentCount = await prisma.roomParameter.count()
    console.log(`📊 Текущее количество параметров: ${currentCount}`)
    
    if (currentCount > 0) {
      console.log('✅ Параметры уже есть в базе')
      return
    }
    
    // Читаем файл с параметрами
    const parametersPath = path.join(__dirname, '../data/room-parameters.json')
    const parametersData = JSON.parse(fs.readFileSync(parametersPath, 'utf8'))
    
    console.log(`📋 Найдено ${parametersData.parameters.length} параметров`)
    
    // Создаем параметры
    let created = 0
    
    for (const param of parametersData.parameters) {
      try {
        await prisma.roomParameter.create({
          data: {
            id: param.id,
            name: param.name,
            unit: param.unit,
            description: param.description || null,
            isActive: param.isActive !== false,
            createdAt: param.createdAt ? new Date(param.createdAt) : new Date(),
            updatedAt: param.updatedAt ? new Date(param.updatedAt) : new Date()
          }
        })
        created++
      } catch (error) {
        console.log(`❌ Ошибка с параметром ${param.name}: ${error.message}`)
      }
    }
    
    console.log(`✅ Восстановление завершено! Создано ${created} параметров`)
    
    // Показываем примеры
    const samples = await prisma.roomParameter.findMany({
      take: 5,
      select: { name: true, unit: true, id: true }
    })
    
    console.log('\n📋 Примеры восстановленных параметров:')
    samples.forEach(param => {
      console.log(`  • ${param.name} (${param.unit}) - ID: ${param.id}`)
    })
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreRoomParameters()
