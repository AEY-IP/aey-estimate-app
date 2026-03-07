import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'

const mapTemplateWork = (work: any) => ({
  ...work,
  workItem: work.work_items
    ? {
        ...work.work_items,
        block: work.work_items.work_blocks
      }
    : null
})

const mapTemplateBlock = (block: any) => ({
  ...block,
  works: (block.template_works || []).map(mapTemplateWork)
})

// GET /api/templates/[id]/blocks/[blockId] - Получить конкретный блок работ
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ADMIN и MANAGER могут просматривать блоки
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const block = await prisma.template_work_blocks.findFirst({
      where: {
        id: params.blockId,
        template_rooms: {
          templateId: params.id,
          templates: { isActive: true }
        }
      },
      include: {
        template_works: {
          include: {
            work_items: {
              include: {
                work_blocks: true
              }
            }
          },
          orderBy: { id: 'asc' }
        }
      }
    })

    if (!block) {
      return NextResponse.json(
        { error: 'Блок работ не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json(mapTemplateBlock(block))
  } catch (error) {
    console.error('Ошибка получения блока работ:', error)
    return NextResponse.json(
      { error: 'Ошибка получения блока работ' },
      { status: 500 }
    )
  }
}

// PUT /api/templates/[id]/blocks/[blockId] - Обновить блок работ
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только ADMIN может редактировать блоки
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, isCollapsed } = body

    // Проверяем существование блока
    const existingBlock = await prisma.template_work_blocks.findFirst({
      where: {
        id: params.blockId,
        template_rooms: {
          templateId: params.id,
          templates: { isActive: true }
        }
      }
    })

    if (!existingBlock) {
      return NextResponse.json(
        { error: 'Блок работ не найден' },
        { status: 404 }
      )
    }

    // Если изменяется название, проверяем уникальность
    if (title && title.trim() !== existingBlock.title) {
      const duplicateBlock = await prisma.template_work_blocks.findFirst({
        where: {
          roomId: existingBlock.roomId,
          title: title.trim(),
          id: { not: params.blockId }
        }
      })

      if (duplicateBlock) {
        return NextResponse.json(
          { error: 'Блок с таким названием уже существует в этом помещении' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim()
    if (isCollapsed !== undefined) updateData.isCollapsed = isCollapsed

    const updatedBlock = await prisma.template_work_blocks.update({
      where: { id: params.blockId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
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
    })

    return NextResponse.json(mapTemplateBlock(updatedBlock))
  } catch (error) {
    console.error('Ошибка обновления блока работ:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления блока работ' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id]/blocks/[blockId] - Удалить блок работ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только ADMIN может удалять блоки
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Проверяем существование блока
    const existingBlock = await prisma.template_work_blocks.findFirst({
      where: {
        id: params.blockId,
        template_rooms: {
          templateId: params.id,
          templates: { isActive: true }
        }
      },
      include: {
        template_works: true
      }
    })

    if (!existingBlock) {
      return NextResponse.json(
        { error: 'Блок работ не найден' },
        { status: 404 }
      )
    }

    // Удаляем блок (работы удалятся автоматически через CASCADE)
    await prisma.template_work_blocks.delete({
      where: { id: params.blockId }
    })

    // Обновляем общую стоимость помещения
    const room = await prisma.template_rooms.findUnique({
      where: { id: existingBlock.roomId },
      include: {
        template_works: true,
        template_materials: true
      }
    })

    if (room) {
      const totalWorksPrice = room.template_works.reduce((sum, work) => sum + work.totalPrice, 0)
      const totalMaterialsPrice = room.template_materials.reduce((sum, material) => sum + material.totalPrice, 0)

      await prisma.template_rooms.update({
        where: { id: room.id },
        data: {
          totalWorksPrice,
          totalMaterialsPrice,
          totalPrice: totalWorksPrice + totalMaterialsPrice,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({ message: 'Блок работ удален' })
  } catch (error) {
    console.error('Ошибка удаления блока работ:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления блока работ' },
      { status: 500 }
    )
  }
}
