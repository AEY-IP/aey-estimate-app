import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { CreateClientRequest } from '@/types/client'

// GET - получить клиентов (менеджеры видят только своих, админы - всех)
export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const sessionCookie = request.cookies.get('auth-session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    
    const where: any = {
      isActive: true
    }
    
    // Менеджеры видят только своих клиентов
    if (session.role === 'MANAGER') {
      where.createdBy = session.id
    }
    
    // Админы видят всех клиентов (where остается как есть)
    if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST - создать нового клиента
export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const sessionCookie = request.cookies.get('auth-session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    const body: CreateClientRequest = await request.json()
    const { name, phone, email, address, contractNumber, notes } = body

    // Валидация
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Название клиента обязательно' }, { status: 400 })
    }

    // Создаем нового клиента в базе данных
    const newClient = await prisma.client.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        contractNumber: contractNumber?.trim() || null,
        notes: notes?.trim() || null,
        createdBy: session.id,
        isActive: true
      }
    })

    return NextResponse.json(newClient, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
} 