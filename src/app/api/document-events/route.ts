import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkAuth } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - получить все блоки документов клиента
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

    // Проверяем доступ к клиенту
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client || !client.isActive) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Получаем блоки документов
    const documentBlocks = await (prisma as any).documentBlock.findMany({
      where: {
        clientId: clientId,
        isVisible: true
      },
      include: {
        documents: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ documentBlocks })
  } catch (error) {
    console.error('Error fetching document blocks:', error)
    return NextResponse.json({ error: 'Ошибка загрузки блоков документов' }, { status: 500 })
  }
}

// POST - создать новый блок документов
export async function POST(request: NextRequest) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { clientId, title, description } = await request.json()

    if (!clientId || !title?.trim()) {
      return NextResponse.json({ 
        error: 'Не указан ID клиента или название блока' 
      }, { status: 400 })
    }

    // Проверяем доступ к клиенту
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client || !client.isActive) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Создаем блок документов
    const documentBlock = await (prisma as any).documentBlock.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        clientId: clientId,
        createdBy: session.id
      },
      include: {
        documents: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(documentBlock)
  } catch (error) {
    console.error('Error creating document block:', error)
    return NextResponse.json({ error: 'Ошибка создания блока документов' }, { status: 500 })
  }
} 