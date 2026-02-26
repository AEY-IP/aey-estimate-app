import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth, canAccessMainSystem } from '@/lib/auth'


export const dynamic = 'force-dynamic'
// GET - получить клиента по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== CLIENT API GET START ===')
    console.log('Requested client ID:', params.id)
    console.log('Request URL:', request.url)

    // Проверяем аутентификацию
    const session = checkAuth(request)
    console.log('Session exists:', !!session)
    
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к основным клиентам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    console.log('Session data:', { id: session.id, role: session.role, username: session.username })
    
    // Сначала найдём клиента по ID
    console.log('Searching for client in database...')
    const client = await prisma.client.findUnique({
      where: { 
        id: params.id 
      }
    })
    
    console.log('Database query result:', client ? { id: client.id, name: client.name, isActive: client.isActive, createdBy: client.createdBy } : 'null')

    if (!client) {
      console.log('Client not found in database')
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    if (!client.isActive) {
      console.log('Client is inactive')
      return NextResponse.json({ error: 'Клиент деактивирован' }, { status: 404 })
    }
    
    // Проверяем права доступа для менеджеров и дизайнеров
    if (session.role === 'MANAGER' && client.createdBy !== session.id && (client as any).managerId !== session.id) {
      console.log('Access denied for manager. Session ID:', session.id, 'Client createdBy:', client.createdBy, 'managerId:', (client as any).managerId)
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    if (session.role === 'DESIGNER' && (client as any).designerId !== session.id) {
      console.log('Access denied for designer. Session ID:', session.id, 'Client designerId:', (client as any).designerId)
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    console.log('Client access granted, returning data')
    console.log('=== CLIENT API GET END ===')
    return NextResponse.json(client)
  } catch (error) {
    console.error('Error in client GET API:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// PUT - обновить клиента
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем аутентификацию
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к основным клиентам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    // Сначала найдём клиента по ID
    const existingClient = await prisma.client.findUnique({
      where: { 
        id: params.id 
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }
    
    if (!existingClient.isActive) {
      return NextResponse.json({ error: 'Клиент деактивирован' }, { status: 404 })
    }
    
    // Проверяем права доступа для менеджеров и дизайнеров
    if (session.role === 'MANAGER' && existingClient.createdBy !== session.id && (existingClient as any).managerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    // Дизайнеры не могут редактировать клиентов
    if (session.role === 'DESIGNER') {
      return NextResponse.json({ error: 'Дизайнеры не могут редактировать клиентов' }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, email, address, contractNumber, contractDate, notes, managerId, designerId } = body

    // Обновляем клиента
    const updateData: any = {
      updatedAt: new Date()
    }
    
    // Если присылается только managerId или designerId (для быстрого назначения)
    const isQuickAssignment = (managerId !== undefined || designerId !== undefined) && !name
    
    if (!isQuickAssignment) {
      // Полное обновление - валидация обязательных полей
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Название клиента обязательно' }, { status: 400 })
      }

      if (phone && (typeof phone !== 'string' || phone.length === 0)) {
        return NextResponse.json({ error: 'Некорректный телефон' }, { status: 400 })
      }

      if (email && (typeof email !== 'string' || !email.includes('@'))) {
        return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
      }

      // Проверяем уникальность имени (исключая текущего клиента)
      const existingClientWithName = await prisma.client.findFirst({
        where: {
          id: { not: params.id },
          name: { equals: name.trim(), mode: 'insensitive' },
          isActive: true
        }
      })
      
      if (existingClientWithName) {
        return NextResponse.json({ error: 'Клиент с таким названием уже существует' }, { status: 400 })
      }

      // Добавляем основные поля
      updateData.name = name.trim()
      updateData.phone = phone?.trim() || null
      updateData.email = email?.trim() || null
      updateData.address = address?.trim() || null
      updateData.contractNumber = contractNumber?.trim() || null
      updateData.contractDate = contractDate?.trim() || null
      updateData.notes = notes?.trim() || null
    }
    
    // Только ADMIN может изменять managerId и designerId
    if (session.role === 'ADMIN') {
      if (managerId !== undefined) {
        updateData.managerId = managerId || null
      }
      if (designerId !== undefined) {
        updateData.designerId = designerId || null
      }
    }
    
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// DELETE - удалить клиента
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем аутентификацию
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к основным клиентам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    // Сначала найдём клиента по ID
    const existingClient = await prisma.client.findUnique({
      where: { 
        id: params.id 
      },
      include: {
        estimates: true // Убрали фильтр по status поскольку это поле удалено
      }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }
    
    if (!existingClient.isActive) {
      return NextResponse.json({ error: 'Клиент уже удален' }, { status: 404 })
    }
    
    // Проверяем права доступа для менеджеров
    if (session.role === 'MANAGER' && existingClient.createdBy !== session.id && (existingClient as any).managerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    // Дизайнеры не могут удалять клиентов
    if (session.role === 'DESIGNER') {
      return NextResponse.json({ error: 'Дизайнеры не могут удалять клиентов' }, { status: 403 })
    }

    // Проверяем, есть ли сметы (без фильтра по status)
    if (existingClient.estimates.length > 0) {
      return NextResponse.json({ 
        error: 'Нельзя удалить клиента с активными сметами. Сначала удалите все сметы.' 
      }, { status: 400 })
    }

    // Помечаем клиента как неактивного (мягкое удаление)
    const deletedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: 'Клиент успешно удален',
      client: deletedClient 
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
} 