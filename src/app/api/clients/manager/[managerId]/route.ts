import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { managerId: string } }
) {
  try {
    // Проверяем аутентификацию
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { managerId } = params

    // Получаем информацию о менеджере
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        name: true,
        username: true
      }
    })

    if (!manager) {
      return NextResponse.json({ error: 'Менеджер не найден' }, { status: 404 })
    }

    // Получаем клиентов этого менеджера
    const clients = await prisma.client.findMany({
      where: {
        createdBy: managerId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Добавляем информацию о создателе к клиентам
    const clientsWithCreator = clients.map(client => ({
      ...client,
      createdByUser: {
        name: manager.name,
        username: manager.username
      }
    }))

    return NextResponse.json({
      manager,
      clients: clientsWithCreator
    })
  } catch (error) {
    console.error('Error fetching manager clients:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
} 