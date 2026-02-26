const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Функция для создания кеша экспорта для смет типа "apartment"
async function createExportCacheForApartment(estimate, coefficients) {
  console.log('Создание кеша для сметы типа apartment...')
  
  // Парсим данные из JSON полей
  let summaryWorksBlock = JSON.parse(estimate.summaryWorksBlock || '{"blocks":[]}')
  let summaryMaterialsBlock = JSON.parse(estimate.summaryMaterialsBlock || '{"items":[]}')
  
  // Если summary блоки пустые, используем основные блоки как fallback
  if (!summaryWorksBlock.blocks || summaryWorksBlock.blocks.length === 0) {
    console.log('summaryWorksBlock пуст, использую worksBlock как fallback')
    summaryWorksBlock = JSON.parse(estimate.worksBlock || '{"blocks":[]}')
  }
  
  if (!summaryMaterialsBlock.items || summaryMaterialsBlock.items.length === 0) {
    console.log('summaryMaterialsBlock пуст, использую materialsBlock как fallback')
    summaryMaterialsBlock = JSON.parse(estimate.materialsBlock || '{"items":[]}')
  }
  
  const manualPrices = new Set(JSON.parse(estimate.manualPrices || '[]'))
  
  console.log(`Блоков работ: ${summaryWorksBlock.blocks?.length || 0}`)
  console.log(`Материалов: ${summaryMaterialsBlock.items?.length || 0}`)
  
  // Обрабатываем работы и добавляем недостающие поля
  const worksData = (summaryWorksBlock.blocks || []).map(block => ({
    ...block,
    items: (block.items || []).map(item => {
      // Рассчитываем цену за единицу если её нет
      const totalPrice = item.displayTotalPrice || item.totalPrice || 0
      const quantity = item.quantity || 1
      const unitPrice = quantity > 0 ? Math.round(totalPrice / quantity) : 0
      
      return {
        ...item,
        displayUnitPrice: unitPrice,
        displayTotalPrice: totalPrice,
        // Добавляем недостающие поля если их нет
        unitPrice: item.unitPrice || unitPrice,
        totalPrice: totalPrice
      }
    })
  }))
  
  const totalWorksPrice = worksData.reduce((sum, block) => {
    return sum + (block.items || []).reduce((blockSum, item) => {
      return blockSum + (item.displayTotalPrice || 0)
    }, 0)
  }, 0)

  // Обрабатываем материалы аналогично
  const materialsData = (summaryMaterialsBlock.items || []).map(item => {
    const totalPrice = item.displayTotalPrice || item.totalPrice || 0
    const quantity = item.quantity || 1
    const unitPrice = quantity > 0 ? Math.round(totalPrice / quantity) : 0
    
    return {
      ...item,
      displayUnitPrice: unitPrice,
      displayTotalPrice: totalPrice,
      unitPrice: item.unitPrice || unitPrice,
      totalPrice: totalPrice
    }
  })
  
  const totalMaterialsPrice = materialsData.reduce((sum, item) => {
    return sum + (item.displayTotalPrice || 0)
  }, 0)

  console.log(`Итого работы: ${totalWorksPrice}`)
  console.log(`Итого материалы: ${totalMaterialsPrice}`)

  return {
    worksData,
    materialsData,
    totalWorksPrice,
    totalMaterialsPrice,
    grandTotal: totalWorksPrice + totalMaterialsPrice
  };
}

// Функция для создания кеша экспорта для смет типа "rooms"
async function createExportCacheForRooms(estimate, coefficients) {
  console.log('Создание кеша для сметы типа rooms...')
  
  const blocks = [];
  let totalWorksPrice = 0;
  let totalMaterialsPrice = 0;

  // Получаем коэффициенты (но не применяем их, так как цены уже рассчитаны)
  const globalCoeff = coefficients.find(c => c.name === 'Глобальный коэффициент')?.value || 1;
  const normalCoeff = 1;
  const finalCoeff = coefficients.find(c => c.type === 'final')?.value || 1;

  // Группируем работы по блокам из всех комнат
  const blockMap = new Map();

  // Ручные цены
  const manualPrices = new Set(JSON.parse(estimate.manualPrices || '[]'));

  for (const room of estimate.rooms) {
    for (const work of room.works) {
      const blockTitle = work.blockTitle || 'Прочее';
      
      if (!blockMap.has(blockTitle)) {
        blockMap.set(blockTitle, {
          id: `block_${blockTitle.replace(/\s+/g, '_')}`,
          title: blockTitle,
          items: [],
          totalPrice: 0
        });
      }

      const block = blockMap.get(blockTitle);
      
      // Используем уже рассчитанные цены из профи кабинета
      // work.totalPrice уже содержит все примененные коэффициенты
      const calculatedUnitPrice = work.totalPrice / work.quantity;
      const adjustedUnitPrice = calculatedUnitPrice;
      const adjustedTotalPrice = work.totalPrice;
      
      // Определяем, была ли цена изменена вручную (для группировки)
      const basePrice = work.workItem?.price || 0;
      const expectedAutoPrice = Math.round(basePrice * work.quantity);
      const isManualPrice = work.totalPrice !== expectedAutoPrice && !manualPrices.has(work.id);

      // Проверяем есть ли уже такая работа в блоке (группируем одинаковые)
      const workName = work.workItem?.name || 'Без названия'
      const workUnit = work.workItem?.unit || 'шт'
      const workItemId = work.workItem?.id
      const isCurrentManual = isManualPrice || manualPrices.has(work.id)
      
      const existingItem = block.items.find(item => 
        item.name === workName && 
        item.unit === workUnit &&
        item.workItemId === workItemId &&
        item.isManualPrice === isCurrentManual
      )

      if (existingItem) {
        // Группируем: суммируем количество и стоимость
        existingItem.quantity += work.quantity
        existingItem.totalPrice += Math.round(adjustedTotalPrice)
        existingItem.adjustedTotalPrice += Math.round(adjustedTotalPrice)
        existingItem.displayTotalPrice += Math.round(adjustedTotalPrice)
        // Пересчитываем цену за единицу
        existingItem.displayUnitPrice = Math.round(existingItem.displayTotalPrice / existingItem.quantity)
        existingItem.adjustedUnitPrice = existingItem.displayUnitPrice
      } else {
        // Добавляем новую работу
        block.items.push({
          id: work.id,
          name: workName,
          unit: workUnit,
          quantity: work.quantity,
          unitPrice: basePrice,
          adjustedUnitPrice: Math.round(adjustedUnitPrice),
          totalPrice: Math.round(adjustedTotalPrice),
          adjustedTotalPrice: Math.round(adjustedTotalPrice),
          displayUnitPrice: Math.round(adjustedUnitPrice),
          displayTotalPrice: Math.round(adjustedTotalPrice),
          workItemId: workItemId,
          isManualPrice: isCurrentManual
        })
      }

      totalWorksPrice += Math.round(adjustedTotalPrice);
    }
  }

  // Преобразуем в массив и пересчитываем totalPrice для блоков
  blockMap.forEach(block => {
    block.totalPrice = block.items.reduce((sum, item) => sum + item.displayTotalPrice, 0)
    blocks.push(block);
  });

  return {
    works: blocks,
    materials: [], // Материалы пока пустые
    totalWorksPrice,
    totalMaterialsPrice,
    grandTotal: totalWorksPrice + totalMaterialsPrice
  };
}

async function recreateExportCache(estimateId) {
  try {
    console.log(`Пересоздание кеша экспорта для сметы ${estimateId}...`)
    
    // Получаем полную смету
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        client: true,
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
    });

    if (!estimate) {
      console.error('Смета не найдена')
      return
    }

    console.log(`Найдена смета: ${estimate.title}`)
    console.log(`Тип: ${estimate.type}`)
    
    if (estimate.type === 'rooms') {
      console.log(`Комнат: ${estimate.rooms.length}`)
    }

    // Получаем коэффициенты
    const estimateCoefficients = JSON.parse(estimate.coefficientsData || '[]');
    const coefficients = await prisma.coefficient.findMany({
      where: {
        id: { in: estimateCoefficients },
        isActive: true
      }
    });

    console.log(`Коэффициентов: ${coefficients.length}`)

    // Удаляем старый кеш
    await prisma.estimateExport.deleteMany({
      where: { estimateId }
    })

    console.log('Старый кеш удален')

    // Создаем новый кеш в зависимости от типа сметы
    let exportData
    
    if (estimate.type === 'rooms') {
      exportData = await createExportCacheForRooms(estimate, coefficients);
    } else if (estimate.type === 'apartment') {
      exportData = await createExportCacheForApartment(estimate, coefficients);
    } else {
      console.error(`Неподдерживаемый тип сметы: ${estimate.type}`)
      return
    }
    
    console.log(`Общая стоимость работ: ${exportData.totalWorksPrice}`)
    console.log(`Общая стоимость материалов: ${exportData.totalMaterialsPrice}`)
    console.log(`Общая стоимость: ${exportData.grandTotal}`)

    // Сохраняем в базу
    await prisma.estimateExport.create({
      data: {
        estimateId,
        worksData: JSON.stringify(exportData.worksData || exportData.works),
        materialsData: JSON.stringify(exportData.materialsData || exportData.materials),
        totalWorksPrice: exportData.totalWorksPrice,
        totalMaterialsPrice: exportData.totalMaterialsPrice,
        grandTotal: exportData.grandTotal,
        coefficientsInfo: JSON.stringify({
          normal: 1,
          final: coefficients.find(c => c.type === 'final')?.value || 1,
          global: 1,
          applied: coefficients
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('Новый кеш создан успешно!')

  } catch (error) {
    console.error('Ошибка пересоздания кеша:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Запуск скрипта
const estimateId = process.argv[2]
if (!estimateId) {
  console.error('Использование: node recreate-export-cache.js <estimateId>')
  process.exit(1)
}

recreateExportCache(estimateId) 