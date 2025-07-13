const { PrismaClient } = require('@prisma/client')

async function testEstimateUpdate() {
  const prisma = new PrismaClient()
  
  try {
    console.log('�� Тестируем обновление сметы с полной логикой...')
    
    // Найдем смету с помещениями
    const estimate = await prisma.estimate.findFirst({
      where: { type: 'rooms' },
      include: {
        rooms: {
          include: {
            works: {
              include: {
                workItem: true
              }
            },
            materials: true
          }
        }
      }
    })
    
    if (!estimate) {
      console.log('❌ Нет смет типа "rooms" для тестирования')
      return
    }
    
    console.log('📋 Тестируем смету:', estimate.title)
    console.log('📊 Помещений:', estimate.rooms.length)
    
    // Симулируем обновление через API логику
    const updateData = {
      title: estimate.title,
      type: estimate.type,
      totalWorksPrice: estimate.totalWorksPrice,
      totalMaterialsPrice: estimate.totalMaterialsPrice,
      totalPrice: estimate.totalPrice,
      updatedAt: new Date()
    }
    
    console.log('🔄 Обновляем базовые поля...')
    const updated = await prisma.estimate.update({
      where: { id: estimate.id },
      data: updateData
    })
    
    console.log('✅ Базовое обновление прошло успешно')
    
    // Тестируем обновление помещений
    if (estimate.rooms.length > 0) {
      const room = estimate.rooms[0]
      console.log('🏠 Обновляем помещение:', room.name)
      
      const roomUpdateData = {
        name: room.name,
        totalWorksPrice: room.totalWorksPrice || 0,
        totalMaterialsPrice: room.totalMaterialsPrice || 0,
        totalPrice: room.totalPrice || 0
      }
      
      const updatedRoom = await prisma.estimateRoom.update({
        where: { id: room.id },
        data: roomUpdateData
      })
      
      console.log('✅ Обновление помещения прошло успешно')
      
      // Тестируем работы
      if (room.works.length > 0) {
        console.log('🔧 Тестируем обновление работ...')
        
        // Удаляем старые работы
        await prisma.estimateWork.deleteMany({
          where: { roomId: room.id }
        })
        console.log('🗑️ Старые работы удалены')
        
        // Создаем новые работы (на основе существующих)
        const newWorks = room.works.map(work => ({
          roomId: room.id,
          quantity: work.quantity || 0,
          price: work.price || 0,
          totalPrice: work.totalPrice || 0,
          description: work.description || '',
          workItemId: work.workItemId,
          blockTitle: work.blockTitle || 'Без категории'
        })).filter(work => work.workItemId)
        
        if (newWorks.length > 0) {
          await prisma.estimateWork.createMany({
            data: newWorks
          })
          console.log('✅ Работы пересозданы, количество:', newWorks.length)
        }
      }
    }
    
    console.log('🎉 Полный тест обновления сметы прошел успешно!')
    
  } catch (error) {
    console.error('❌ Ошибка в тесте:', error.message)
    console.error('Детали:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testEstimateUpdate()
