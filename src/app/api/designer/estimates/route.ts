import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Не указан ID клиента' }, { status: 400 })
    }

    const client = await prisma.designerClient.findUnique({
      where: { id: clientId }
    })

    if (!client || !client.isActive) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    if (session.role === 'DESIGNER' && client.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role !== 'ADMIN' && session.role !== 'DESIGNER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const estimates = await prisma.designerEstimate.findMany({
      where: {
        clientId,
        isActive: true
      },
      include: {
        client: true,
        designer: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        blocks: {
          where: { isActive: true },
          include: {
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const estimatesWithTotals = estimates.map(estimate => {
      const totalAmount = estimate.blocks.reduce((sum, block) => {
        const blockTotal = block.items.reduce((itemSum, item) => itemSum + item.totalPrice, 0)
        return sum + blockTotal
      }, 0)

      return {
        ...estimate,
        totalAmount,
        itemsCount: estimate.blocks.reduce((sum, block) => sum + block.items.length, 0),
        blocksCount: estimate.blocks.length
      }
    })

    return NextResponse.json({ estimates: estimatesWithTotals })
  } catch (error) {
    console.error('Error fetching designer estimates:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (session.role !== 'DESIGNER' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, clientId } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название сметы обязательно' }, { status: 400 })
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Не указан клиент' }, { status: 400 })
    }

    const client = await prisma.designerClient.findUnique({
      where: { id: clientId }
    })

    if (!client || !client.isActive) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    if (session.role === 'DESIGNER' && client.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const estimate = await prisma.designerEstimate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        clientId,
        designerId: session.role === 'DESIGNER' ? session.id : client.designerId
      },
      include: {
        client: true,
        designer: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({ estimate })
  } catch (error) {
    console.error('Error creating designer estimate:', error)
    return NextResponse.json({ error: 'Ошибка создания сметы' }, { status: 500 })
  }
}
