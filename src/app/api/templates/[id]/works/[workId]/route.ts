import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient()

// DELETE /api/templates/[id]/works/[workId] - Удалить работу из шаблона
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; workId: string } }
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

    // Проверяем существование шаблона
    const template = await prisma.template.findUnique({
      where: { id: params.id, isActive: true }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Получаем работу для определения помещения и блока
    const work = await prisma.templateWork.findUnique({
      where: { id: params.workId },
      include: { room: true }
    })

    if (!work || work.room.templateId !== params.id) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      )
    }

    const roomId = work.roomId
    const workBlockId = work.workBlockId

    // Удаляем работу
    await prisma.templateWork.delete({
      where: { id: params.workId }
    })

    // Обновляем итоги блока работ (если работа была в блоке)
    if (workBlockId) {
      const blockWorks = await prisma.templateWork.findMany({
        where: { workBlockId }
      })

      const blockTotalPrice = blockWorks.reduce((sum, work) => sum + work.totalPrice, 0)

      await prisma.templateWorkBlock.update({
        where: { id: workBlockId },
        data: { totalPrice: blockTotalPrice }
      })
    }

    // Обновляем итоги помещения
    const roomWorks = await prisma.templateWork.findMany({
      where: { roomId }
    })

    const roomTotalWorksPrice = roomWorks.reduce((sum, work) => sum + work.totalPrice, 0)

    await prisma.templateRoom.update({
      where: { id: roomId },
      data: {
        totalWorksPrice: roomTotalWorksPrice,
        totalPrice: roomTotalWorksPrice
      }
    })

    // Обновляем итоги шаблона
    const allRooms = await prisma.templateRoom.findMany({
      where: { templateId: params.id }
    })

    const templateTotalWorksPrice = allRooms.reduce((sum, room) => sum + room.totalWorksPrice, 0)

    await prisma.template.update({
      where: { id: params.id },
      data: {
        totalWorksPrice: templateTotalWorksPrice,
        totalPrice: templateTotalWorksPrice
      }
    })

    return NextResponse.json({ message: 'Работа успешно удалена' })

  } catch (error) {
    console.error('Ошибка удаления работы из шаблона:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/templates/[id]/works/[workId] - Обновить работу в шаблоне
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; workId: string } }
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
    const { quantity, description } = body

    // Проверяем существование шаблона
    const template = await prisma.template.findUnique({
      where: { id: params.id, isActive: true }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Получаем работу
    const work = await prisma.templateWork.findUnique({
      where: { id: params.workId },
      include: { 
        room: true,
        workItem: true
      }
    })

    if (!work || work.room.templateId !== params.id) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      )
    }

    const roomId = work.roomId
    const workBlockId = work.workBlockId
    const newQuantity = quantity !== undefined ? parseFloat(quantity) : work.quantity
    const newTotalPrice = newQuantity * work.price

    // Обновляем работу
    const updatedWork = await prisma.templateWork.update({
      where: { id: params.workId },
      data: {
        ...(quantity !== undefined && { quantity: newQuantity }),
        ...(description !== undefined && { description }),
        totalPrice: newTotalPrice
      },
      include: {
        workItem: {
          include: {
            block: true
          }
        }
      }
    })

    // Обновляем итоги блока работ (если работа в блоке)
    if (workBlockId) {
      const blockWorks = await prisma.templateWork.findMany({
        where: { workBlockId }
      })

      const blockTotalPrice = blockWorks.reduce((sum, work) => sum + work.totalPrice, 0)

      await prisma.templateWorkBlock.update({
        where: { id: workBlockId },
        data: { totalPrice: blockTotalPrice }
      })
    }

    // Обновляем итоги помещения
    const roomWorks = await prisma.templateWork.findMany({
      where: { roomId }
    })

    const roomTotalWorksPrice = roomWorks.reduce((sum, work) => sum + work.totalPrice, 0)

    await prisma.templateRoom.update({
      where: { id: roomId },
      data: {
        totalWorksPrice: roomTotalWorksPrice,
        totalPrice: roomTotalWorksPrice
      }
    })

    // Обновляем итоги шаблона
    const allRooms = await prisma.templateRoom.findMany({
      where: { templateId: params.id }
    })

    const templateTotalWorksPrice = allRooms.reduce((sum, room) => sum + room.totalWorksPrice, 0)

    await prisma.template.update({
      where: { id: params.id },
      data: {
        totalWorksPrice: templateTotalWorksPrice,
        totalPrice: templateTotalWorksPrice
      }
    })

    return NextResponse.json(updatedWork)

  } catch (error) {
    console.error('Ошибка обновления работы в шаблоне:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
