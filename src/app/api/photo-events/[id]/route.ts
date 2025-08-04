import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkAuth } from '@/lib/auth'
import { del } from '@vercel/blob'

const prisma = new PrismaClient()

// GET - получить блок фотографий
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const photoBlock = await prisma.photoBlock.findUnique({
      where: { id: params.id },
      include: {
        photos: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' }
        },
        client: true
      }
    })

    if (!photoBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    // Проверяем права доступа для менеджеров
    if (session.role === 'MANAGER' && photoBlock.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    return NextResponse.json(photoBlock)
  } catch (error) {
    console.error('Error fetching photo block:', error)
    return NextResponse.json({ error: 'Ошибка загрузки блока' }, { status: 500 })
  }
}

// PUT - редактировать блок фотографий
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
    const photoBlock = await prisma.photoBlock.findUnique({
      where: { id: params.id },
      include: { client: true }
    })

    if (!photoBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && photoBlock.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Обновляем блок
    const updatedBlock = await prisma.photoBlock.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        photos: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(updatedBlock)
  } catch (error) {
    console.error('Error updating photo block:', error)
    return NextResponse.json({ error: 'Ошибка обновления блока' }, { status: 500 })
  }
}

// DELETE - удалить блок фотографий
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Получаем блок с фотографиями
    const photoBlock = await prisma.photoBlock.findUnique({
      where: { id: params.id },
      include: {
        photos: true,
        client: true
      }
    })

    if (!photoBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && photoBlock.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Удаляем все фото из Vercel Blob
    for (const photo of photoBlock.photos) {
      try {
        await del(photo.filePath)
      } catch (error) {
        console.error(`Ошибка удаления файла ${photo.filePath}:`, error)
        // Продолжаем даже если не удалось удалить файл
      }
    }

    // Удаляем блок (каскадно удалятся и фото из БД)
    await prisma.photoBlock.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo block:', error)
    return NextResponse.json({ error: 'Ошибка удаления блока' }, { status: 500 })
  }
} 