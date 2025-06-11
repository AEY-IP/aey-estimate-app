import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

// GET /api/works - получение всех работ из БД
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10000')

    const skip = (page - 1) * limit

    const where: any = {}

    if (category && category !== 'all') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [works, total] = await Promise.all([
      prisma.workItem.findMany({
        where,
        include: {
          parameter: true,
          block: true
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.workItem.count({ where })
    ])

    const transformedWorks = works.map(work => ({
      id: work.id,
      name: work.name,
      unit: work.unit,
      basePrice: work.price,
      category: work.block.title,
      description: work.description,
      parameterId: work.parameterId,
      isActive: work.isActive,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,
      parameter: work.parameter
    }))

    return NextResponse.json({
      works: transformedWorks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Ошибка загрузки работ:', error)
    return NextResponse.json({ error: 'Ошибка загрузки работ' }, { status: 500 })
  }
}

// POST /api/works - создание новой работы
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, unit, basePrice, category, blockId, description, parameterId } = body

    // Только название обязательно
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Название работы обязательно' }, { status: 400 })
    }

    // Определяем blockId - либо передан напрямую, либо ищем по category
    let finalBlockId = blockId
    if (!finalBlockId && category) {
      const block = await prisma.workBlock.findFirst({
        where: { title: category }
      })
      if (block) {
        finalBlockId = block.id
      }
    }

    // Если блока нет, создаем "Разное"
    if (!finalBlockId) {
      const miscBlock = await prisma.workBlock.findFirst({
        where: { title: 'Разное' }
      })
      
      if (miscBlock) {
        finalBlockId = miscBlock.id
      } else {
        const newBlock = await prisma.workBlock.create({
          data: {
            title: 'Разное',
            description: 'Прочие работы'
          }
        })
        finalBlockId = newBlock.id
      }
    }

    const work = await prisma.workItem.create({
      data: {
        name: name.trim(),
        unit: unit?.trim() || 'шт',
        price: basePrice ? parseFloat(basePrice) : 0,
        blockId: finalBlockId,
        description: description?.trim() || '',
        parameterId: parameterId || null
      },
      include: {
        parameter: true,
        block: true
      }
    })

    // Преобразуем для фронтенда
    const transformedWork = {
      id: work.id,
      name: work.name,
      unit: work.unit,
      basePrice: work.price,
      category: work.block.title,
      description: work.description,
      parameterId: work.parameterId,
      isActive: work.isActive,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,
      parameter: work.parameter
    }

    return NextResponse.json(transformedWork, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания работы:', error)
    return NextResponse.json({ error: 'Ошибка создания работы' }, { status: 500 })
  }
} 