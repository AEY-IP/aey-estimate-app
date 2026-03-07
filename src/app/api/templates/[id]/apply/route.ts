import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { randomUUID } from 'crypto'


export const dynamic = 'force-dynamic'

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
    const template = await prisma.templates.findFirst({
      where: {
        id: params.id,
        isActive: true
      },
      include: {
        template_rooms: {
          include: {
            template_works: {
              include: {
                work_items: {
                  include: {
                    work_blocks: true
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
    const estimate = await prisma.estimates.findUnique({
      where: { id: estimateId },
      include: {
        estimate_rooms: true
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
      
      targetRoom = await prisma.estimate_rooms.findFirst({
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
      targetRoom = estimate.estimate_rooms[0]
      if (!targetRoom) {
        targetRoom = await prisma.estimate_rooms.create({
          data: {
            id: randomUUID(),
            name: 'Основное помещение',
            estimateId: estimateId,
            sortOrder: 0,
            updatedAt: new Date()
          }
        })
      }
    }

    // Получаем актуальные цены из справочника работ
    const workItemIds = template.template_rooms.flatMap(room =>
      room.template_works.filter(work => work.workItemId).map(work => work.workItemId!)
    )

    const currentWorkItems = await prisma.work_items.findMany({
      where: {
        id: { in: workItemIds }
      },
      include: {
        work_blocks: true
      }
    })

    const workItemsMap = new Map(currentWorkItems.map(item => [item.id, item]))

    // Применяем работы из шаблона к целевому помещению
    const worksToCreate = []
    
    for (const templateRoom of template.template_rooms) {
      for (const templateWork of templateRoom.template_works) {
        let workData: any = {
          id: randomUUID(),
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
            blockTitle: currentWorkItem.work_blocks?.title || 'Разное'
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
    await prisma.estimate_works.createMany({
      data: worksToCreate
    })

    // Обновляем итоги помещения
    const roomWorks = await prisma.estimate_works.findMany({
      where: { roomId: targetRoom.id }
    })

    const roomTotalWorksPrice = roomWorks.reduce((sum, work) => sum + work.totalPrice, 0)

    await prisma.estimate_rooms.update({
      where: { id: targetRoom.id },
      data: {
        totalWorksPrice: roomTotalWorksPrice,
        totalPrice: roomTotalWorksPrice,
        updatedAt: new Date()
      }
    })

    // Обновляем итоги сметы
    const allRooms = await prisma.estimate_rooms.findMany({
      where: { estimateId: estimateId }
    })

    const estimateTotalWorksPrice = allRooms.reduce((sum, room) => sum + room.totalWorksPrice, 0)
    const estimateTotalPrice = allRooms.reduce((sum, room) => sum + room.totalPrice, 0)

    await prisma.estimates.update({
      where: { id: estimateId },
      data: {
        totalWorksPrice: estimateTotalWorksPrice,
        totalPrice: estimateTotalPrice,
        updatedAt: new Date()
      }
    })

    // Удаляем кеш экспорта, если он есть
    await prisma.estimate_exports.deleteMany({
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
