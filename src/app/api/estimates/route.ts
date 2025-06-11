import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    
    let whereClause: any = {}
    
    // Фильтрация по клиенту если указан
    if (clientId) {
      whereClause.clientId = clientId
      
      // Проверяем права доступа к клиенту
      const client = await prisma.client.findUnique({
        where: { id: clientId, isActive: true }
      })
      
      if (!client) {
        return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
      }
      
      if (session.role === 'MANAGER' && client.createdBy !== session.id) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
      }
    } else {
      // Без фильтра по клиенту - показываем только доступные сметы
      if (session.role === 'MANAGER') {
        // Менеджеры видят только сметы своих клиентов
        const myClients = await prisma.client.findMany({
          where: { createdBy: session.id, isActive: true },
          select: { id: true }
        })
        
        whereClause.clientId = {
          in: myClients.map(c => c.id)
        }
      }
      // Админы видят все сметы
    }
    
    const estimates = await prisma.estimate.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        rooms: {
          include: {
            works: {
              include: {
                workItem: true
              }
            },
            materials: true
          }
        },
        coefficients: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    return NextResponse.json(estimates)
  } catch (error) {
    console.error('Ошибка получения смет:', error)
    return NextResponse.json(
      { error: 'Ошибка получения смет' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { title, type = 'rooms', category = 'main', clientId } = body
    
    if (!title || !clientId) {
      return NextResponse.json(
        { error: 'Обязательные поля: title, clientId' },
        { status: 400 }
      )
    }
    
    // Проверяем существование клиента и права доступа
    const client = await prisma.client.findUnique({
      where: { id: clientId, isActive: true }
    })
    
    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }
    
    // Менеджеры могут создавать сметы только для своих клиентов
    if (session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const newEstimate = await prisma.estimate.create({
      data: {
        title,
        type,
        category,
        clientId,
        createdBy: session.id,
        totalWorksPrice: 0,
        totalMaterialsPrice: 0,
        totalPrice: 0
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        rooms: true,
        coefficients: true
      }
    })
    
    return NextResponse.json(newEstimate)
  } catch (error) {
    console.error('Ошибка создания сметы:', error)
    return NextResponse.json(
      { error: 'Ошибка создания сметы' },
      { status: 500 }
    )
  }
} 