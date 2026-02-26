import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { newTitle, targetClientId } = await request.json()
    
    if (!newTitle?.trim()) {
      return NextResponse.json({ error: 'Название сметы обязательно' }, { status: 400 })
    }

    if (!targetClientId) {
      return NextResponse.json({ error: 'ID клиента обязателен' }, { status: 400 })
    }

    // Получаем исходную смету со всей структурой
    const sourceEstimate = await prisma.estimate.findUnique({
      where: { id: params.id },
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
        },
        coefficients: true,
        exportCache: true
      }
    })

    if (!sourceEstimate) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    // Проверяем права доступа к исходной смете
    if (session.user.role === 'MANAGER' && sourceEstimate.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Нет доступа к этой смете' }, { status: 403 })
    }

    // Проверяем существование целевого клиента
    const targetClient = await prisma.client.findUnique({
      where: { id: targetClientId }
    })

    if (!targetClient) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    // Начинаем транзакцию для копирования
    const result = await prisma.$transaction(async (tx) => {
      // 1. Создаем новую смету
      const newEstimate = await tx.estimate.create({
        data: {
          title: newTitle.trim(),
          type: sourceEstimate.type,
          category: sourceEstimate.category,
          notes: sourceEstimate.notes,
          showToClient: false, // Новая смета по умолчанию скрыта от клиента
          isAct: false, // Новая смета не акт
          clientId: targetClientId,
          createdBy: session.user.id
        }
      })

      // 2. Копируем коэффициенты
      if (sourceEstimate.coefficients.length > 0) {
        await tx.coefficient.createMany({
          data: sourceEstimate.coefficients.map(coeff => ({
            estimateId: newEstimate.id,
            name: coeff.name,
            value: coeff.value,
            description: coeff.description,
            sortOrder: coeff.sortOrder
          }))
        })
      }

      // 3. Копируем комнаты со всей структурой
      for (const room of sourceEstimate.rooms) {
        const newRoom = await tx.estimateRoom.create({
          data: {
            name: room.name,
            totalWorksPrice: room.totalWorksPrice,
            totalMaterialsPrice: room.totalMaterialsPrice,
            totalPrice: room.totalPrice,
            sortOrder: room.sortOrder,
            estimateId: newEstimate.id
          }
        })

        // Копируем работы комнаты
        if (room.works.length > 0) {
          await tx.estimateWork.createMany({
            data: room.works.map(work => ({
              quantity: work.quantity,
              price: work.price,
              totalPrice: work.totalPrice,
              description: work.description,
              roomId: newRoom.id,
              workItemId: work.workItemId,
              blockTitle: work.blockTitle,
              manualWorkName: work.manualWorkName,
              manualWorkUnit: work.manualWorkUnit
            }))
          })
        }

        // Копируем материалы комнаты
        if (room.materials.length > 0) {
          await tx.estimateMaterial.createMany({
            data: room.materials.map(material => ({
              name: material.name,
              unit: material.unit,
              quantity: material.quantity,
              price: material.price,
              totalPrice: material.totalPrice,
              description: material.description,
              roomId: newRoom.id
            }))
          })
        }
      }

      // 4. Генерируем кэш экспорта для новой сметы
      await generateExportCache(tx, newEstimate.id)

      return newEstimate
    })

    return NextResponse.json({
      message: 'Смета успешно скопирована',
      estimateId: result.id
    })

  } catch (error) {
    console.error('Ошибка копирования сметы:', error)
    return NextResponse.json(
      { error: 'Ошибка копирования сметы' },
      { status: 500 }
    )
  }
}

// Функция генерации кэша экспорта
async function generateExportCache(tx: any, estimateId: string) {
  try {
    // Получаем данные сметы для кэша
    const estimate = await tx.estimate.findUnique({
      where: { id: estimateId },
      include: {
        client: true,
        creator: true,
        rooms: {
          include: {
            works: {
              include: {
                workItem: true
              }
            },
            materials: true
          }
        },
        coefficients: true
      }
    })

    if (!estimate) return

    // Формируем данные для кэша
    const cacheData = {
      estimate: {
        id: estimate.id,
        title: estimate.title,
        type: estimate.type,
        category: estimate.category,
        notes: estimate.notes,
        createdAt: estimate.createdAt,
        updatedAt: estimate.updatedAt
      },
      client: {
        id: estimate.client.id,
        name: estimate.client.name
      },
      creator: {
        id: estimate.creator.id,
        name: estimate.creator.name
      },
      rooms: estimate.rooms.map(room => ({
        id: room.id,
        name: room.name,
        totalWorksPrice: room.totalWorksPrice,
        totalMaterialsPrice: room.totalMaterialsPrice,
        totalPrice: room.totalPrice,
        sortOrder: room.sortOrder,
        works: room.works.map(work => ({
          id: work.id,
          workItemId: work.workItemId,
          blockTitle: work.blockTitle,
          manualWorkName: work.manualWorkName,
          manualWorkUnit: work.manualWorkUnit,
          quantity: work.quantity,
          price: work.price,
          totalPrice: work.totalPrice,
          description: work.description,
          workItem: work.workItem ? {
            id: work.workItem.id,
            name: work.workItem.name,
            unit: work.workItem.unit,
            price: work.workItem.price
          } : null
        })),
        materials: room.materials.map(material => ({
          id: material.id,
          name: material.name,
          unit: material.unit,
          quantity: material.quantity,
          price: material.price,
          totalPrice: material.totalPrice
        }))
      })),
      coefficients: estimate.coefficients.map(coeff => ({
        id: coeff.id,
        name: coeff.name,
        value: coeff.value,
        description: coeff.description
      }))
    }

    // Сохраняем кэш
    await tx.estimateExport.upsert({
      where: { estimateId },
      update: {
        data: cacheData,
        updatedAt: new Date()
      },
      create: {
        estimateId,
        data: cacheData
      }
    })

  } catch (error) {
    console.error('Ошибка генерации кэша экспорта:', error)
    // Не бросаем ошибку, чтобы не прервать основную транзакцию
  }
}
