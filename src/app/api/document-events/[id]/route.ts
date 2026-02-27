import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkAuth } from '@/lib/auth'
import { deleteFile } from '@/lib/storage'


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient()

// GET - получить блок документов
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const documentBlock = await (prisma as any).document_blocks.findUnique({
      where: { id: params.id },
      include: {
        documents: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' }
        },
        clients: true
      }
    })

    if (!documentBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    // Проверяем права доступа для менеджеров
    if (session.role === 'MANAGER' && documentBlock.clients.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    return NextResponse.json(documentBlock)
  } catch (error) {
    console.error('Error fetching document block:', error)
    return NextResponse.json({ error: 'Ошибка загрузки блока' }, { status: 500 })
  }
}

// PUT - редактировать блок документов
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
    const documentBlock = await (prisma as any).document_blocks.findUnique({
      where: { id: params.id },
      include: { clients: true }
    })

    if (!documentBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && documentBlock.clients.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Обновляем блок
    const updatedBlock = await (prisma as any).document_blocks.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        documents: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(updatedBlock)
  } catch (error) {
    console.error('Error updating document block:', error)
    return NextResponse.json({ error: 'Ошибка обновления блока' }, { status: 500 })
  }
}

// DELETE - удалить блок документов
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Получаем блок с документами
    const documentBlock = await (prisma as any).document_blocks.findUnique({
      where: { id: params.id },
      include: {
        documents: true,
        clients: true
      }
    })

    if (!documentBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && documentBlock.clients.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Удаляем все документы из Vercel Blob
    for (const document of documentBlock.documents) {
      try {
        await deleteFile(document.filePath)
      } catch (error) {
        console.error(`Ошибка удаления файла ${document.filePath}:`, error)
        // Продолжаем даже если не удалось удалить файл
      }
    }

    // Удаляем блок (каскадно удалятся и документы из БД)
    await (prisma as any).document_blocks.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document block:', error)
    return NextResponse.json({ error: 'Ошибка удаления блока' }, { status: 500 })
  }
} 