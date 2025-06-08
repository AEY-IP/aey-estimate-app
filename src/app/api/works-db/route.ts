import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

// GET /api/works-db - получение всех работ из БД
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const skip = (page - 1) * limit

    const where: any = {
      isActive: true
    }

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
          parameter: true
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.workItem.count({ where })
    ])

    return NextResponse.json({
      works,
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

// POST /api/works-db - создание новой работы
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, unit, basePrice, category, description, parameterId } = body

    if (!name || !unit || basePrice === undefined || !category) {
      return NextResponse.json({ error: 'Отсутствуют обязательные поля' }, { status: 400 })
    }

    const work = await prisma.workItem.create({
      data: {
        name,
        unit,
        basePrice: parseFloat(basePrice),
        category,
        description,
        parameterId
      },
      include: {
        parameter: true
      }
    })

    return NextResponse.json(work, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания работы:', error)
    return NextResponse.json({ error: 'Ошибка создания работы' }, { status: 500 })
  }
} 