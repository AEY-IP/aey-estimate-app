import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'

async function checkBlockAccess(blockId: string, sessionId: string, role: string) {
  const block = await prisma.designerEstimateBlock.findUnique({
    where: { id: blockId },
    include: {
      estimate: true
    }
  })

  if (!block || !block.isActive) {
    return { error: 'Блок не найден', status: 404 }
  }

  if (role === 'DESIGNER' && block.estimate.designerId !== sessionId) {
    return { error: 'Доступ запрещен', status: 403 }
  }

  if (role !== 'ADMIN' && role !== 'DESIGNER') {
    return { error: 'Недостаточно прав', status: 403 }
  }

  return { block }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, blockId: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const accessCheck = await checkBlockAccess(params.blockId, session.id, session.role)
    if (accessCheck.error) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const body = await request.json()
    const { name, description, parentId, level } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название блока обязательно' }, { status: 400 })
    }

    if (parentId && parentId !== accessCheck.block!.parentId) {
      const parentBlock = await prisma.designerEstimateBlock.findUnique({
        where: { id: parentId }
      })

      if (!parentBlock || parentBlock.estimateId !== params.id) {
        return NextResponse.json({ error: 'Родительский блок не найден' }, { status: 404 })
      }
    }

    const block = await prisma.designerEstimateBlock.update({
      where: { id: params.blockId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        parentId: parentId || null,
        level: level || accessCheck.block!.level
      },
      include: {
        items: true,
        parent: true,
        children: true
      }
    })

    return NextResponse.json({ block })
  } catch (error) {
    console.error('Error updating block:', error)
    return NextResponse.json({ error: 'Ошибка обновления блока' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string, blockId: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const accessCheck = await checkBlockAccess(params.blockId, session.id, session.role)
    if (accessCheck.error) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const body = await request.json()
    const { sortOrder, parentId } = body

    const updateData: any = {}
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (parentId !== undefined) updateData.parentId = parentId || null

    const block = await prisma.designerEstimateBlock.update({
      where: { id: params.blockId },
      data: updateData
    })

    return NextResponse.json({ block })
  } catch (error) {
    console.error('Error updating block sort order:', error)
    return NextResponse.json({ error: 'Ошибка обновления порядка блока' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, blockId: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const accessCheck = await checkBlockAccess(params.blockId, session.id, session.role)
    if (accessCheck.error) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    await prisma.designerEstimateBlock.update({
      where: { id: params.blockId },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting block:', error)
    return NextResponse.json({ error: 'Ошибка удаления блока' }, { status: 500 })
  }
}
