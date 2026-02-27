import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient()

// POST /api/templates/[id]/works - Добавить работу в блок шаблона
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только ADMIN может редактировать шаблоны
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { roomId, workBlockId, workItemId, quantity, manualWorkName, manualWorkUnit, price, blockTitle, description } = body

    if (!roomId || !workBlockId || !quantity) {
      return NextResponse.json(
        { error: 'ID помещения, ID блока работ и количество обязательны' },
        { status: 400 }
      )
    }

    // Проверяем существование шаблона
    const template = await prisma.templates.findUnique({
      where: { id: params.id, isActive: true }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Проверяем существование помещения
    const room = await prisma.template_rooms.findFirst({
      where: {
        id: roomId,
        templateId: params.id
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Помещение не найдено' },
        { status: 404 }
      )
    }

    // Проверяем существование блока работ
    const workBlock = await prisma.template_work_blocks.findFirst({
      where: {
        id: workBlockId,
        roomId
      }
    })

    if (!workBlock) {
      return NextResponse.json(
        { error: 'Блок работ не найден' },
        { status: 404 }
      )
    }

    let workData: any = {
      roomId,
      workBlockId,
      quantity: parseFloat(quantity),
      description
    }

    if (workItemId) {
      // Работа из справочника
      const workItem = await prisma.work_items.findUnique({
        where: { id: workItemId },
        include: { block: true }
      })

      if (!workItem) {
        return NextResponse.json(
          { error: 'Работа не найдена в справочнике' },
          { status: 404 }
        )
      }

      workData = {
        ...workData,
        workItemId,
        price: workItem.price,
        totalPrice: parseFloat(quantity) * workItem.price,
        blockTitle: workItem.block.title
      }
    } else if (manualWorkName && manualWorkUnit && price) {
      // Ручная работа
      const workPrice = parseFloat(price)
      workData = {
        ...workData,
        manualWorkName,
        manualWorkUnit,
        price: workPrice,
        totalPrice: parseFloat(quantity) * workPrice,
        blockTitle: blockTitle || 'Дополнительные работы'
      }
    } else {
      return NextResponse.json(
        { error: 'Необходимо указать либо ID работы из справочника, либо данные ручной работы' },
        { status: 400 }
      )
    }

    // Создаем работу
    const work = await prisma.template_works.create({
      data: workData,
      include: {
        workItem: {
          include: {
            block: true
          }
        }
      }
    })

    // Обновляем итоги блока работ
    const blockWorks = await prisma.template_works.findMany({
      where: { workBlockId }
    })

    const blockTotalPrice = blockWorks.reduce((sum, work) => sum + work.totalPrice, 0)

    await prisma.template_work_blocks.update({
      where: { id: workBlockId },
      data: { totalPrice: blockTotalPrice }
    })

    // Обновляем итоги помещения
    const roomWorks = await prisma.template_works.findMany({
      where: { roomId }
    })

    const roomTotalWorksPrice = roomWorks.reduce((sum, work) => sum + work.totalPrice, 0)

    await prisma.template_rooms.update({
      where: { id: roomId },
      data: {
        totalWorksPrice: roomTotalWorksPrice,
        totalPrice: roomTotalWorksPrice
      }
    })

    // Обновляем итоги шаблона
    const allRooms = await prisma.template_rooms.findMany({
      where: { templateId: params.id }
    })

    const templateTotalWorksPrice = allRooms.reduce((sum, room) => sum + room.totalWorksPrice, 0)

    await prisma.templates.update({
      where: { id: params.id },
      data: {
        totalWorksPrice: templateTotalWorksPrice,
        totalPrice: templateTotalWorksPrice
      }
    })

    return NextResponse.json(work, { status: 201 })

  } catch (error) {
    console.error('Ошибка добавления работы в шаблон:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
