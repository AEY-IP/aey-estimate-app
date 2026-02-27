import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { prisma } from '@/lib/database';


export const dynamic = 'force-dynamic'
// Функция calculateEstimatePricesServer удалена - логика перенесена в export-cache API

// Создание кеша экспорта для смет типа "rooms"
async function createExportCacheForRooms(estimate: any, coefficients: any[]) {
  const blocks: any[] = [];
  let totalWorksPrice = 0;
  let totalMaterialsPrice = 0;

  // Получаем глобальный коэффициент для материалов
  const globalCoeff = coefficients.find(c => c.name === 'Глобальный коэффициент')?.value || 1;
  
  // Получаем остальные коэффициенты 
  const normalCoeff = 1;
  const finalCoeff = coefficients.find(c => c.type === 'final')?.value || 1;

  // Группируем работы по блокам из всех комнат
  const blockMap = new Map();

  // Ручные цены
  const manualPrices = new Set(JSON.parse(estimate.manualPrices || '[]'));

  const rooms = estimate.estimate_rooms || estimate.rooms || [];
  for (const room of rooms) {
    const works = room.estimate_works || room.works || [];
    for (const work of works) {
      const blockTitle = work.blockTitle || 'Прочее';
      
      if (!blockMap.has(blockTitle)) {
        blockMap.set(blockTitle, {
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
      const workItem = work.work_items || work.workItem;
      const basePrice = workItem?.price || 0;
      const expectedAutoPrice = Math.round(basePrice * work.quantity);
      const isManualPrice = work.totalPrice !== expectedAutoPrice && !manualPrices.has(work.id);

      // Проверяем есть ли уже такая работа в блоке (группируем одинаковые)
      const workName = workItem?.name || 'Без названия'
      const workUnit = workItem?.unit || 'шт'
      const workItemId = workItem?.id
      const isCurrentManual = isManualPrice || manualPrices.has(work.id)
      
      const existingItem = block.items.find((item: any) => 
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

      block.totalPrice += Math.round(adjustedTotalPrice);
      totalWorksPrice += Math.round(adjustedTotalPrice);
    }
  }

  // Преобразуем в массив
  blockMap.forEach(block => {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const estimateId = params.id;

    // Получаем смету с информацией о клиенте
    const estimate = await prisma.estimates.findUnique({
      where: { id: estimateId },
      include: {
        clients: true
      }
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 });
    }

    // Проверяем права доступа
    if (session.role === 'MANAGER' && estimate.clients.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Переключаем видимость
    const updatedEstimate = await prisma.estimates.update({
      where: { id: estimateId },
      data: {
        showToClient: !estimate.showToClient
      }
    });

    // Если смета становится видимой клиенту, создаем/обновляем кеш экспорта
    if (updatedEstimate.showToClient) {
      try {
        // Получаем полную смету с коэффициентами для создания кеша
        const fullEstimate = await prisma.estimates.findUnique({
          where: { id: estimateId },
          include: {
            clients: true,
            estimate_rooms: {
              include: {
                estimate_works: {
                  include: {
                    work_items: true
                  }
                },
                estimate_materials: true
              }
            }
          }
        });

        if (fullEstimate) {
          // Получаем коэффициенты
          const estimateCoefficients = JSON.parse(fullEstimate.coefficientsData || '[]');
          const coefficients = await prisma.coefficients.findMany({
            where: {
              id: { in: estimateCoefficients },
              isActive: true
            }
          });

          // Создаем кеш экспорта с рассчитанными ценами
          const exportData = await createExportCacheForRooms(fullEstimate, coefficients);
          
          // Сохраняем в базу
          await prisma.estimate_exports.upsert({
            where: { estimateId },
            update: {
              worksData: JSON.stringify(exportData.works),
              materialsData: JSON.stringify(exportData.materials),
              totalWorksPrice: exportData.totalWorksPrice,
              totalMaterialsPrice: exportData.totalMaterialsPrice,
              grandTotal: exportData.grandTotal,
              updatedAt: new Date()
            },
            create: {
              estimateId,
              worksData: JSON.stringify(exportData.works),
              materialsData: JSON.stringify(exportData.materials),
              totalWorksPrice: exportData.totalWorksPrice,
              totalMaterialsPrice: exportData.totalMaterialsPrice,
              grandTotal: exportData.grandTotal,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      } catch (cacheError) {
        console.error('Ошибка создания кеша экспорта:', cacheError);
        // Не прерываем выполнение - просто логируем ошибку
      }
    }

    return NextResponse.json({
      success: true,
      showToClient: updatedEstimate.showToClient
    });

  } catch (error) {
    console.error('Ошибка переключения видимости сметы:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 