import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient()

// GET /api/templates/[id]/blocks - Получить блоки работ шаблона
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ADMIN и MANAGER могут просматривать шаблоны
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const template = await prisma.templates.findUnique({
      where: { id: params.id, isActive: true },
      include: {
        rooms: {
          include: {
            workBlocks: {
              include: {
                works: {
                  include: {
                    workItem: {
                      include: {
                        block: true
                      }
                    }
                  }
                }
              },
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { sortOrder: 'asc' }
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
    console.error('Ошибка получения блоков шаблона:', error)
    return NextResponse.json(
      { error: 'Ошибка получения блоков шаблона' },
      { status: 500 }
    )
  }
}

// POST /api/templates/[id]/blocks - Создать блок работ в шаблоне
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Только ADMIN может создавать блоки в шаблонах
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { roomId, title, description } = body

    if (!roomId || !title?.trim()) {
      return NextResponse.json(
        { error: 'ID помещения и название блока обязательны' },
        { status: 400 }
      )
    }

    // Проверяем существование шаблона
    const template = await prisma.templates.findUnique({
      where: { id: params.id, isActive: true }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Проверяем существование помещения
    const room = await prisma.template_rooms.findFirst({
      where: {
        id: roomId,
        templateId: params.id
      }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Помещение не найдено' },
        { status: 404 }
      )
    }

    // Проверяем, что блок с таким названием еще не существует в этом помещении
    const existingBlock = await prisma.template_work_blocks.findFirst({
      where: {
        roomId,
        title: title.trim()
      }
    })

    if (existingBlock) {
      return NextResponse.json(
        { error: 'Блок с таким названием уже существует в этом помещении' },
        { status: 400 }
      )
    }

    // Получаем максимальный sortOrder для новой позиции
    const maxSortOrder = await prisma.template_work_blocks.findFirst({
      where: { roomId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const newBlock = await prisma.template_work_blocks.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        roomId,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1
      },
      include: {
        works: {
          include: {
            workItem: {
              include: {
                block: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(newBlock, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания блока работ:', error)
    return NextResponse.json(
      { error: 'Ошибка создания блока работ' },
      { status: 500 }
    )
  }
}
