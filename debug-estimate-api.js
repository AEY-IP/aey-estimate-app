const { PrismaClient } = require('@prisma/client')

async function debugEstimateAPI() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Отладка проблемы с сохранением сметы...')
    
    // Берем смету с помещениями но без работ
    const estimate = await prisma.estimate.findFirst({
      where: { 
        type: 'rooms',
        rooms: { some: {} }
      },
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
      console.log('❌ Нет подходящих смет')
      return
    }
    
    console.log('📋 Смета:', estimate.title)
    console.log('🏠 Помещений:', estimate.rooms.length)
    
    const room = estimate.rooms[0]
    console.log('📊 Первое помещение:', room.name)
    console.log('   Работ:', room.works.length)
    console.log('   Материалов:', room.materials.length)
    
    // Симулируем данные для обновления как от фронтенда
    const updateBody = {
      title: estimate.title,
      type: estimate.type,
      totalWorksPrice: 0,
      totalMaterialsPrice: 0,
      totalPrice: 0,
      rooms: estimate.rooms.map(room => ({
        id: room.id,
        name: room.name,
        totalWorksPrice: 0,
        totalMaterialsPrice: 0,
        totalPrice: 0,
        worksBlock: {
          id: `works_${room.id}`,
          title: `Работы - ${room.name}`,
          blocks: [], // Пустой массив блоков
          totalPrice: 0
        },
        materialsBlock: {
          id: `materials_${room.id}`,
          title: `Материалы - ${room.name}`,
          items: [], // Пустой массив материалов
          totalPrice: 0
        }
      }))
    }
    
    console.log('🧪 Тестируем логику обновления...')
    console.log('   Помещений для обновления:', updateBody.rooms.length)
    
    // Тестируем обновление основной записи
    const updatedEstimate = await prisma.estimate.update({
      where: { id: estimate.id },
      data: {
        title: updateBody.title,
        totalWorksPrice: updateBody.totalWorksPrice,
        totalMaterialsPrice: updateBody.totalMaterialsPrice,
        totalPrice: updateBody.totalPrice,
        updatedAt: new Date()
      }
    })
    console.log('✅ Основная запись обновлена')
    
    // Тестируем обновление помещений
    for (const roomData of updateBody.rooms) {
      console.log('🏠 Обновляем помещение:', roomData.name)
      
      // Обновляем помещение
      await prisma.estimateRoom.update({
        where: { id: roomData.id },
        data: {
          name: roomData.name,
          totalWorksPrice: roomData.totalWorksPrice,
          totalMaterialsPrice: roomData.totalMaterialsPrice,
          totalPrice: roomData.totalPrice
        }
      })
      console.log('   ✅ Помещение обновлено')
      
      // Удаляем старые работы
      await prisma.estimateWork.deleteMany({
        where: { roomId: roomData.id }
      })
      console.log('   🗑️ Старые работы удалены')
      
      // Создаем новые работы (пустой массив)
      const works = (roomData.worksBlock?.blocks || []).flatMap(block =>
        (block.items || []).map(item => ({
          roomId: roomData.id,
          quantity: item.quantity || 0,
          price: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0,
          description: item.description || '',
          workItemId: item.workId || item.workItemId,
          blockTitle: block.title
        }))
      ).filter(work => work.workItemId)
      
      console.log('   📝 Работ для создания:', works.length)
      
      if (works.length > 0) {
        await prisma.estimateWork.createMany({
          data: works
        })
        console.log('   ✅ Работы созданы')
      } else {
        console.log('   ✅ Работы пропущены (пустой массив)')
      }
      
      // Удаляем старые материалы
      await prisma.estimateMaterial.deleteMany({
        where: { roomId: roomData.id }
      })
      console.log('   🗑️ Старые материалы удалены')
      
      // Создаем новые материалы (пустой массив)
      const materials = (roomData.materialsBlock?.items || []).map(item => ({
        roomId: roomData.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity || 0,
        price: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        description: item.description || ''
      }))
      
      console.log('   📝 Материалов для создания:', materials.length)
      
      if (materials.length > 0) {
        await prisma.estimateMaterial.createMany({
          data: materials
        })
        console.log('   ✅ Материалы созданы')
      } else {
        console.log('   ✅ Материалы пропущены (пустой массив)')
      }
    }
    
    console.log('🎉 Полная симуляция обновления прошла успешно!')
    
  } catch (error) {
    console.error('❌ Ошибка в симуляции:', error.message)
    console.error('💻 Детали ошибки:', error)
    
    if (error.code) {
      console.error('🔍 Код ошибки Prisma:', error.code)
    }
  } finally {
    await prisma.$disconnect()
  }
}

debugEstimateAPI()
