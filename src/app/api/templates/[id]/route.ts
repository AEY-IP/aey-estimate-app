import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient()

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

    const template = await prisma.template.findUnique({
      where: {
        id: params.id,
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
              },
              orderBy: {
                id: 'asc'
              }
            },
            materials: {
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

    return NextResponse.json(template)
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
    const existingTemplate = await prisma.template.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Обновляем шаблон
    const template = await prisma.template.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive })
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

    return NextResponse.json(template)
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
    const existingTemplate = await prisma.template.findUnique({
      where: { id: params.id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Мягкое удаление - помечаем как неактивный
    await prisma.template.update({
      where: { id: params.id },
      data: { isActive: false }
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
