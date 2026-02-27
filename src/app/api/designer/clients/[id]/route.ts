import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'


export const dynamic = 'force-dynamic'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const client = await prisma.designer_clients.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        designer_estimates: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
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

    return NextResponse.json({
      client: {
        ...client,
        designer: client.users,
        estimates: client.designer_estimates
      }
    })
  } catch (error) {
    console.error('Error fetching designer client:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const existingClient = await prisma.designer_clients.findUnique({
      where: { id: params.id }
    })

    if (!existingClient || !existingClient.isActive) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    if (session.role === 'DESIGNER' && existingClient.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role !== 'ADMIN' && session.role !== 'DESIGNER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, email, address, notes } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название клиента обязательно' }, { status: 400 })
    }

    const client = await prisma.designer_clients.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({
      client: {
        ...client,
        designer: client.users
      }
    })
  } catch (error) {
    console.error('Error updating designer client:', error)
    return NextResponse.json({ error: 'Ошибка обновления клиента' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const existingClient = await prisma.designer_clients.findUnique({
      where: { id: params.id }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    if (session.role === 'DESIGNER' && existingClient.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role !== 'ADMIN' && session.role !== 'DESIGNER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    await prisma.designer_clients.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting designer client:', error)
    return NextResponse.json({ error: 'Ошибка удаления клиента' }, { status: 500 })
  }
}
