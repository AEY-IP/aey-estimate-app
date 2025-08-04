import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkAuth } from '@/lib/auth'
import { del } from '@vercel/blob'

const prisma = new PrismaClient()

// GET - получить блок чеков
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const receiptBlock = await prisma.receiptBlock.findUnique({
      where: { id: params.id },
      include: {
        receipts: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' }
        },
        client: true
      }
    })

    if (!receiptBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    // Проверяем права доступа для менеджеров
    if (session.role === 'MANAGER' && receiptBlock.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    return NextResponse.json(receiptBlock)
  } catch (error) {
    console.error('Error fetching receipt block:', error)
    return NextResponse.json({ error: 'Ошибка загрузки блока' }, { status: 500 })
  }
}

// PUT - редактировать блок чеков
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { title, description } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Название блока обязательно' },
        { status: 400 }
      )
    }

    // Проверяем существование блока и права доступа
    const receiptBlock = await prisma.receiptBlock.findUnique({
      where: { id: params.id },
      include: { client: true }
    })

    if (!receiptBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && receiptBlock.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Обновляем блок
    const updatedBlock = await prisma.receiptBlock.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        receipts: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(updatedBlock)
  } catch (error) {
    console.error('Error updating receipt block:', error)
    return NextResponse.json({ error: 'Ошибка обновления блока' }, { status: 500 })
  }
}

// DELETE - удалить блок чеков
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Получаем блок с чеками
    const receiptBlock = await prisma.receiptBlock.findUnique({
      where: { id: params.id },
      include: {
        receipts: true,
        client: true
      }
    })

    if (!receiptBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && receiptBlock.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Удаляем все чеки из Vercel Blob
    for (const receipt of receiptBlock.receipts) {
      try {
        await del(receipt.filePath)
      } catch (error) {
        console.error(`Ошибка удаления файла ${receipt.filePath}:`, error)
        // Продолжаем даже если не удалось удалить файл
      }
    }

    // Удаляем блок (каскадно удалятся и чеки из БД)
    await prisma.receiptBlock.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting receipt block:', error)
    return NextResponse.json({ error: 'Ошибка удаления блока' }, { status: 500 })
  }
} 