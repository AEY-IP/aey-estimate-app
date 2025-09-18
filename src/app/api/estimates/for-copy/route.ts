import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser(request)
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем роль пользователя
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Получаем сметы в зависимости от роли
    let whereClause = {}
    
    if (session.user.role === 'MANAGER') {
      // Менеджер видит только свои сметы
      whereClause = {
        createdBy: session.user.id,
        isAct: false // Только сметы, не акты
      }
    } else {
      // Администратор видит все сметы
      whereClause = {
        isAct: false // Только сметы, не акты
      }
    }

    const estimates = await prisma.estimate.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        type: true,
        category: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { client: { name: 'asc' } },
        { createdAt: 'desc' }
      ]
    })

    // Группируем сметы по клиентам
    const clientsMap = new Map()
    
    estimates.forEach(estimate => {
      const clientId = estimate.client.id
      
      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          id: clientId,
          name: estimate.client.name,
          estimates: []
        })
      }
      
      clientsMap.get(clientId).estimates.push(estimate)
    })

    const clients = Array.from(clientsMap.values())

    return NextResponse.json({ clients })

  } catch (error) {
    console.error('Ошибка получения смет для копирования:', error)
    return NextResponse.json(
      { error: 'Ошибка получения смет' },
      { status: 500 }
    )
  }
}
