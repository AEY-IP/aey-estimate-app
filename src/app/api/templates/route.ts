import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'

const prisma = new PrismaClient()

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

    const templates = await prisma.template.findMany({
      where: {
        isActive: true
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        rooms: {
          include: {
            works: {
              include: {
                workItem: {
                  include: {
                    block: true
                  }
                }
              }
            },
            materials: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(templates)
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
    const template = await prisma.template.create({
      data: {
        name,
        type,
        description,
        createdBy: session.user.id,
        rooms: {
          create: {
            name: 'Основное помещение',
            sortOrder: 0
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        rooms: {
          include: {
            works: {
              include: {
                workItem: {
                  include: {
                    block: true
                  }
                }
              }
            },
            materials: true
          }
        }
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания шаблона:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
