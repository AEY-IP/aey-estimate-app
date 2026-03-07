import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { randomUUID } from 'crypto'


export const dynamic = 'force-dynamic'

// GET /api/templates - Получить список шаблонов
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только ADMIN и MANAGER могут просматривать шаблоны
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const templates = await prisma.templates.findMany({
      where: {
        isActive: true
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
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
            },
            template_materials: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(
      templates.map((template) => ({
        ...template,
        creator: template.users,
        rooms: template.template_rooms.map((room) => ({
          ...room,
          works: room.template_works.map((work) => ({
            ...work,
            workItem: work.work_items
          })),
          materials: room.template_materials
        }))
      }))
    )
  } catch (error) {
    console.error('Ошибка получения шаблонов:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Создать новый шаблон
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только ADMIN может создавать шаблоны
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, description } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Название и тип шаблона обязательны' },
        { status: 400 }
      )
    }

    if (!['general', 'room'].includes(type)) {
      return NextResponse.json(
        { error: 'Тип должен быть general или room' },
        { status: 400 }
      )
    }

    // Создаем шаблон с одним помещением по умолчанию
    const template = await prisma.templates.create({
      data: {
        id: randomUUID(),
        name,
        type,
        description: description ?? null,
        createdBy: session.user.id,
        updatedAt: new Date(),
        template_rooms: {
          create: {
            id: randomUUID(),
            name: 'Основное помещение',
            sortOrder: 0,
            updatedAt: new Date()
          }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
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
            },
            template_materials: true
          }
        }
      }
    })

    return NextResponse.json({
      ...template,
      creator: template.users,
      rooms: template.template_rooms.map((room) => ({
        ...room,
        works: room.template_works.map((work) => ({
          ...work,
          workItem: work.work_items
        })),
        materials: room.template_materials
      }))
    }, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания шаблона:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
