import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
// GET /api/works - получение всех работ из БД
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10000')

    const skip = (page - 1) * limit

    // Строим запрос для WorkItem с блоками
    const whereWorkItem: any = {}
    
    if (category && category !== 'all') {
      whereWorkItem.block = {
        title: category
      }
    }

    if (search) {
      whereWorkItem.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [workItems, total] = await Promise.all([
      prisma.work_items.findMany({
        where: whereWorkItem,
        include: {
          block: true,
          parameter: true
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.work_items.count({ where: whereWorkItem })
    ])

    // Преобразуем WorkItem в формат совместимый с фронтендом
    const works = workItems.map(workItem => ({
      id: workItem.id,
      name: workItem.name,
      unit: workItem.unit,
      basePrice: workItem.price,
      category: workItem.block.title,
      description: workItem.description,
      parameterId: workItem.parameterId,
      isActive: workItem.isActive,
      createdAt: workItem.createdAt,
      updatedAt: workItem.updatedAt,
      parameter: workItem.parameter
    }))

    return NextResponse.json({
      works: works,
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
    const { name, unit, basePrice, category, description, parameterId } = body

    // Только название обязательно
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Название работы обязательно' }, { status: 400 })
    }

    // Определяем blockId для категории
    let blockId: string
    const categoryName = category?.trim() || 'Разное'
    
    // Пытаемся найти существующий блок
    let block = await prisma.work_blocks.findFirst({
      where: { title: categoryName }
    })
    
    // Если блок не найден, создаем новый
    if (!block) {
      block = await prisma.work_blocks.create({
        data: { title: categoryName }
      })
    }
    
    blockId = block.id

    const workItem = await prisma.work_items.create({
      data: {
        name: name.trim(),
        unit: unit?.trim() || 'шт',
        price: basePrice ? parseFloat(basePrice) : 0,
        description: description?.trim() || '',
        parameterId: parameterId || null,
        blockId: blockId
      },
      include: {
        block: true,
        parameter: true
      }
    })

    // Преобразуем в формат совместимый с фронтендом
    const work = {
      id: workItem.id,
      name: workItem.name,
      unit: workItem.unit,
      basePrice: workItem.price,
      category: workItem.block.title,
      description: workItem.description,
      parameterId: workItem.parameterId,
      isActive: workItem.isActive,
      createdAt: workItem.createdAt,
      updatedAt: workItem.updatedAt,
      parameter: workItem.parameter
    }

    return NextResponse.json(work, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания работы:', error)
    return NextResponse.json({ error: 'Ошибка создания работы' }, { status: 500 })
  }
} 