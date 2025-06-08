import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

// GET - получить клиента по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET client by ID:', params.id)
    
    // Проверяем аутентификацию
    const sessionCookie = request.cookies.get('auth-session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    console.log('Session:', session)
    
    // Сначала найдём клиента по ID
    const client = await prisma.client.findUnique({
      where: { 
        id: params.id 
      }
    })
    
    console.log('Found client:', client)

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }
    
    if (!client.isActive) {
      return NextResponse.json({ error: 'Клиент деактивирован' }, { status: 404 })
    }
    
    // Проверяем права доступа для менеджеров
    if (session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
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
    const sessionCookie = request.cookies.get('auth-session')
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)
    
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
    
    // Проверяем права доступа для менеджеров
    if (session.role === 'MANAGER' && existingClient.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, email, address, contractNumber, notes } = body

    // Валидация
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

    // Обновляем клиента
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        contractNumber: contractNumber?.trim() || null,
        notes: notes?.trim() || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
} 