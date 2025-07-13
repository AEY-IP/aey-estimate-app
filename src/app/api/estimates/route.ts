import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkAuth, checkClientAuth } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Сначала пробуем cookie-авторизацию для админов
    const session = checkAuth(request)
    // Затем пробуем клиентскую авторизацию через cookie
    const clientSession = checkClientAuth(request)
    
    let userId: string
    let userType: 'admin' | 'client' = 'admin'
    let targetClientId: string | null = null

    if (session) {
      // Cookie-авторизация админа успешна
      userId = session.id
      userType = 'admin'
    } else if (clientSession) {
      // Cookie-авторизация клиента успешна
      userId = clientSession.clientUserId
      userType = 'client'
      targetClientId = clientSession.clientId
    } else {
      return NextResponse.json({ error: 'Авторизация не предоставлена' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const isAct = searchParams.get('isAct') // Параметр для фильтрации актов/смет
    const onlyEstimates = searchParams.get('onlyEstimates') // Параметр для получения только смет (не актов)

    // Если нет clientId и это не запрос только смет для создания актов
    if (!clientId && onlyEstimates !== 'true') {
      return NextResponse.json({ error: 'ID клиента не предоставлен' }, { status: 400 })
    }

    // Для клиентов проверяем, что они запрашивают свои сметы
    if (userType === 'client' && targetClientId && clientId !== targetClientId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Проверяем доступ к клиенту только если clientId указан
    let client = null
    if (clientId) {
      client = await prisma.client.findFirst({
        where: {
          id: clientId,
          isActive: true,
          ...(userType === 'client' && targetClientId ? { id: targetClientId } : {})
        }
      })

      if (!client) {
        return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
      }

      // Для менеджеров проверяем права доступа
      if (session && session.role === 'MANAGER' && client.createdBy !== session.id) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
      }
    }

    // Получаем сметы с учетом типа пользователя
    const whereCondition: any = {}
    
    // Добавляем фильтр по клиенту только если он указан
    if (clientId) {
      whereCondition.clientId = clientId
    } else if (session && session.role === 'MANAGER') {
      // Для менеджеров показываем только сметы их клиентов
      const managerClients = await prisma.client.findMany({
        where: {
          createdBy: session.id,
          isActive: true
        },
        select: { id: true }
      })
      
      whereCondition.clientId = {
        in: managerClients.map(client => client.id)
      }
    }

    // Фильтр актов/смет
    if (isAct !== null) {
      whereCondition.isAct = isAct === 'true'
    }

    // Если запрошены только сметы (не акты)
    if (onlyEstimates === 'true') {
      whereCondition.NOT = {
        isAct: true
      }
    }

    // Для клиентов показываем только видимые сметы и исключаем акты
    if (userType === 'client') {
      whereCondition.showToClient = true
      whereCondition.isAct = false // Исключаем акты из клиентского кабинета
    }

    const estimates = await prisma.estimate.findMany({
      where: whereCondition,
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
            name: true
          }
        },
        // Пока не включаем rooms из-за возможных проблем с данными
        coefficients: userType === 'admin',
        exportCache: userType === 'client' // Включаем кеш экспорта только для клиентов
      },
      orderBy: {
        createdAt: 'desc'
      }
    })



    // Обработка данных в зависимости от типа пользователя
    const processedEstimates = estimates.map((estimate: any) => {
      if (userType === 'client') {
        // Для клиентов возвращаем упрощенные данные
        return {
          id: estimate.id,
          title: estimate.title,
          type: estimate.type,
          category: estimate.category,
          totalWorksPrice: estimate.totalWorksPrice,
          totalMaterialsPrice: estimate.totalMaterialsPrice,
          totalPrice: estimate.totalPrice,
          notes: estimate.notes,
          createdAt: estimate.createdAt,
          updatedAt: estimate.updatedAt,
          isAct: estimate.isAct,
          client: estimate.client,
          creator: estimate.creator,
          // Добавляем кеш экспорта если есть
          cache: estimate.exportCache ? {
            worksData: JSON.parse(estimate.exportCache.worksData),
            materialsData: JSON.parse(estimate.exportCache.materialsData),
            totalWorksPrice: estimate.exportCache.totalWorksPrice,
            totalMaterialsPrice: estimate.exportCache.totalMaterialsPrice,
            grandTotal: estimate.exportCache.grandTotal,
            coefficientsInfo: estimate.exportCache.coefficientsInfo ? JSON.parse(estimate.exportCache.coefficientsInfo) : {
              normal: 1,
              final: 1,
              global: 1,
              applied: []
            },
            estimate: {
              id: estimate.id,
              title: estimate.title,
              createdAt: estimate.createdAt,
              updatedAt: estimate.updatedAt
            }
          } : null
        }
      } else {
        // Для админов возвращаем полные данные с rooms
        return {
          id: estimate.id,
          title: estimate.title,
          type: estimate.type,
          category: estimate.category,
          totalWorksPrice: estimate.totalWorksPrice,
          totalMaterialsPrice: estimate.totalMaterialsPrice,
          totalPrice: estimate.totalPrice,
          notes: estimate.notes,
          createdAt: estimate.createdAt,
          updatedAt: estimate.updatedAt,
          isAct: estimate.isAct,
          showToClient: estimate.showToClient,
          client: estimate.client,
          creator: estimate.creator,
          // rooms: пока убираем из-за проблем с данными
          rooms: []
        }
      }
    })

    return NextResponse.json({
      success: true,
      estimates: processedEstimates
    })
  } catch (error) {
    console.error('Ошибка получения смет:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
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