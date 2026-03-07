import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'


export const dynamic = 'force-dynamic'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const work = await prisma.work_items.findUnique({
      where: { id: params.id },
      include: {
        room_parameters: true,
        work_blocks: true
      }
    })
    
    if (!work) {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      )
    }

    const transformedWork = {
      id: work.id,
      name: work.name,
      unit: work.unit,
      basePrice: work.price,
      category: work.work_blocks?.title || 'Разное',
      description: work.description,
      parameterId: work.parameterId,
      isActive: work.isActive,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,
      parameter: work.room_parameters
    }
    
    return NextResponse.json({ work: transformedWork })
  } catch (error) {
    console.error('Ошибка получения работы:', error)
    return NextResponse.json(
      { error: 'Ошибка получения работы' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, unit, basePrice, category, blockId, description, parameterId, isActive } = body
    
    // Только название обязательно
    if (name !== undefined && !name?.trim()) {
      return NextResponse.json({ error: 'Название работы не может быть пустым' }, { status: 400 })
    }

    // Определяем blockId если передана category
    let finalBlockId = blockId
    if (!finalBlockId && category) {
      // Пытаемся найти существующий блок
      let block = await prisma.work_blocks.findFirst({
        where: { title: category }
      })
      
      // Если блок не найден, создаем новый
      if (!block) {
        block = await prisma.work_blocks.create({
          data: {
            id: randomUUID(),
            title: category,
            updatedAt: new Date()
          }
        })
      }
      
      finalBlockId = block.id
    }

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name.trim()
    if (unit !== undefined) updateData.unit = unit?.trim() || 'шт'
    if (basePrice !== undefined) updateData.price = basePrice ? parseFloat(basePrice) : 0
    if (finalBlockId !== undefined) updateData.blockId = finalBlockId
    if (description !== undefined) updateData.description = description?.trim() || ''
    if (parameterId !== undefined) updateData.parameterId = parameterId || null
    if (isActive !== undefined) updateData.isActive = isActive

    const work = await prisma.work_items.update({
      where: { id: params.id },
      data: updateData,
      include: {
        room_parameters: true,
        work_blocks: true
      }
    })

    const transformedWork = {
      id: work.id,
      name: work.name,
      unit: work.unit,
      basePrice: work.price,
      category: work.work_blocks?.title || category || 'Разное',
      description: work.description,
      parameterId: work.parameterId,
      isActive: work.isActive,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,
      parameter: work.room_parameters
    }
    
    return NextResponse.json({ work: transformedWork })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      )
    }
    console.error('Ошибка обновления работы:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления работы' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isActive } = body
    
    if (isActive === undefined) {
      return NextResponse.json({ error: 'Не указан статус' }, { status: 400 })
    }

    const work = await prisma.work_items.update({
      where: { id: params.id },
      data: { isActive },
      include: {
        room_parameters: true,
        work_blocks: true
      }
    })

    const transformedWork = {
      id: work.id,
      name: work.name,
      unit: work.unit,
      basePrice: work.price,
      category: work.work_blocks?.title || 'Разное',
      description: work.description,
      parameterId: work.parameterId,
      isActive: work.isActive,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,
      parameter: work.room_parameters
    }
    
    return NextResponse.json({ work: transformedWork })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      )
    }
    console.error('Ошибка изменения статуса работы:', error)
    return NextResponse.json(
      { error: 'Ошибка изменения статуса работы' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.work_items.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Работа не найдена' },
        { status: 404 }
      )
    }
    console.error('Ошибка удаления работы:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления работы' },
      { status: 500 }
    )
  }
} 