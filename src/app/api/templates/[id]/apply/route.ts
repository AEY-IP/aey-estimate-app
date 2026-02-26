import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient()

// POST /api/templates/[id]/apply - Применить шаблон к смете
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только ADMIN и MANAGER могут применять шаблоны
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { estimateId, roomId } = body

    if (!estimateId) {
      return NextResponse.json(
        { error: 'ID сметы обязателен' },
        { status: 400 }
      )
    }

    // Получаем шаблон с работами
    const template = await prisma.template.findUnique({
      where: {
        id: params.id,
        isActive: true
      },
      include: {
        rooms: {
          include: {
            works: {
              include: {
                workItem: {
                  include: {
                    block: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Получаем смету
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        rooms: true
      }
    })

    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    // Проверяем права доступа к смете
    if (estimate.createdBy !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Определяем целевое помещение
    let targetRoom
    if (estimate.type === 'rooms') {
      if (!roomId) {
        return NextResponse.json(
          { error: 'Для смет по помещениям необходимо указать ID помещения' },
          { status: 400 }
        )
      }
      
      targetRoom = await prisma.estimateRoom.findFirst({
        where: {
          id: roomId,
          estimateId: estimateId
        }
      })

      if (!targetRoom) {
        return NextResponse.json(
          { error: 'Помещение не найдено' },
          { status: 404 }
        )
      }
    } else {
      // Для смет "apartment" используем первое помещение или создаем его
      targetRoom = estimate.rooms[0]
      if (!targetRoom) {
        targetRoom = await prisma.estimateRoom.create({
          data: {
            name: 'Основное помещение',
            estimateId: estimateId,
            sortOrder: 0
          }
        })
      }
    }

    // Получаем актуальные цены из справочника работ
    const workItemIds = template.rooms.flatMap(room => 
      room.works.filter(work => work.workItemId).map(work => work.workItemId!)
    )

    const currentWorkItems = await prisma.workItem.findMany({
      where: {
        id: { in: workItemIds }
      },
      include: {
        block: true
      }
    })

    const workItemsMap = new Map(currentWorkItems.map(item => [item.id, item]))

    // Применяем работы из шаблона к целевому помещению
    const worksToCreate = []
    
    for (const templateRoom of template.rooms) {
      for (const templateWork of templateRoom.works) {
        let workData: any = {
          roomId: targetRoom.id,
          quantity: templateWork.quantity,
          description: templateWork.description
        }

        if (templateWork.workItemId && workItemsMap.has(templateWork.workItemId)) {
          // Работа из справочника - используем актуальную цену
          const currentWorkItem = workItemsMap.get(templateWork.workItemId)!
          workData = {
            ...workData,
            workItemId: templateWork.workItemId,
            price: currentWorkItem.price,
            totalPrice: templateWork.quantity * currentWorkItem.price,
            blockTitle: currentWorkItem.block.title
          }
        } else if (templateWork.manualWorkName) {
          // Ручная работа - используем сохраненные данные
          workData = {
            ...workData,
            manualWorkName: templateWork.manualWorkName,
            manualWorkUnit: templateWork.manualWorkUnit,
            price: templateWork.price,
            totalPrice: templateWork.totalPrice,
            blockTitle: templateWork.blockTitle
          }
        }

        worksToCreate.push(workData)
      }
    }

    // Создаем работы в базе данных
    await prisma.estimateWork.createMany({
      data: worksToCreate
    })

    // Обновляем итоги помещения
    const roomWorks = await prisma.estimateWork.findMany({
      where: { roomId: targetRoom.id }
    })

    const roomTotalWorksPrice = roomWorks.reduce((sum, work) => sum + work.totalPrice, 0)

    await prisma.estimateRoom.update({
      where: { id: targetRoom.id },
      data: {
        totalWorksPrice: roomTotalWorksPrice,
        totalPrice: roomTotalWorksPrice
      }
    })

    // Обновляем итоги сметы
    const allRooms = await prisma.estimateRoom.findMany({
      where: { estimateId: estimateId }
    })

    const estimateTotalWorksPrice = allRooms.reduce((sum, room) => sum + room.totalWorksPrice, 0)
    const estimateTotalPrice = allRooms.reduce((sum, room) => sum + room.totalPrice, 0)

    await prisma.estimate.update({
      where: { id: estimateId },
      data: {
        totalWorksPrice: estimateTotalWorksPrice,
        totalPrice: estimateTotalPrice
      }
    })

    // Удаляем кеш экспорта, если он есть
    await prisma.estimateExport.deleteMany({
      where: { estimateId: estimateId }
    })

    return NextResponse.json({ 
      message: 'Шаблон успешно применен',
      addedWorksCount: worksToCreate.length,
      targetRoomId: targetRoom.id,
      targetRoomName: targetRoom.name
    })

  } catch (error) {
    console.error('Ошибка применения шаблона:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
