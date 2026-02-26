import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { CreateClientRequest } from '@/types/client'
import { checkAuth, canAccessMainSystem } from '@/lib/auth'


export const dynamic = 'force-dynamic'
// GET - получить клиентов (менеджеры и дизайнеры видят только своих, админы - всех)
export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    const where: any = {
      isActive: true
    }
    
    // Менеджеры видят клиентов, где они createdBy или managerId
    if (session.role === 'MANAGER') {
      where.OR = [
        { createdBy: session.id },
        { managerId: session.id }
      ]
    }
    
    // Дизайнеры видят только клиентов, где они designerId (только INTERNAL)
    if (session.role === 'DESIGNER') {
      if (session.designerType !== 'INTERNAL') {
        return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
      }
      where.designerId = session.id
    }
    
    // Админы видят всех клиентов (where остается как есть)
    if (session.role !== 'ADMIN' && session.role !== 'MANAGER' && session.role !== 'DESIGNER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Получаем информацию о создателях, менеджерах и дизайнерах
    const userIds = Array.from(new Set([
      ...clients.map(c => c.createdBy),
      ...clients.map(c => c.managerId).filter(Boolean),
      ...clients.map(c => c.designerId).filter(Boolean)
    ]))
    
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds as string[] }
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true
      }
    })

    // Добавляем информацию о пользователях к клиентам
    const clientsWithUsers = clients.map(client => ({
      ...client,
      createdByUser: users.find(user => user.id === client.createdBy),
      managerUser: client.managerId ? users.find(user => user.id === client.managerId) : null,
      designerUser: client.designerId ? users.find(user => user.id === client.designerId) : null
    }))

    return NextResponse.json(clientsWithUsers)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST - создать нового клиента
export async function POST(request: NextRequest) {
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

    const body: any = await request.json()
    const { name, phone, email, address, contractNumber, contractDate, notes, managerId, designerId } = body

    // Валидация
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Название клиента обязательно' }, { status: 400 })
    }

    // Дизайнеры не могут создавать клиентов
    if (session.role === 'DESIGNER') {
      return NextResponse.json({ error: 'Дизайнеры не могут создавать клиентов' }, { status: 403 })
    }

    // Создаем нового клиента в базе данных
    const newClient = await prisma.client.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        contractNumber: contractNumber?.trim() || null,
        contractDate: contractDate?.trim() || null,
        notes: notes?.trim() || null,
        createdBy: session.id,
        managerId: managerId || null,
        designerId: designerId || null,
        isActive: true
      }
    })

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
} 