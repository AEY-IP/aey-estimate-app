import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'

// GET /api/templates/[id] - Получить шаблон по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только ADMIN и MANAGER могут просматривать шаблоны
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const template = await prisma.templates.findFirst({
      where: {
        id: params.id,
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
              },
              orderBy: {
                id: 'asc'
              }
            },
            template_materials: {
              orderBy: {
                id: 'asc'
              }
            }
          },
          orderBy: {
            sortOrder: 'asc'
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

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
    })
  } catch (error) {
    console.error('Ошибка получения шаблона:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/templates/[id] - Обновить шаблон
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только ADMIN может обновлять шаблоны
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, description, isActive } = body

    // Проверяем существование шаблона
    const existingTemplate = await prisma.templates.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Обновляем шаблон
    const template = await prisma.templates.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
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
    })
  } catch (error) {
    console.error('Ошибка обновления шаблона:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id] - Удалить шаблон (мягкое удаление)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только ADMIN может удалять шаблоны
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Проверяем существование шаблона
    const existingTemplate = await prisma.templates.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Мягкое удаление - помечаем как неактивный
    await prisma.templates.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Шаблон успешно удален' })
  } catch (error) {
    console.error('Ошибка удаления шаблона:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
