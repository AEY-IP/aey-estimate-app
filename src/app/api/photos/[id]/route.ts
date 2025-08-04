import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkAuth } from '@/lib/auth'
import { del } from '@vercel/blob'

const prisma = new PrismaClient()

// DELETE - удалить отдельную фотографию
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Получаем фото с блоком и клиентом
    const photo = await prisma.photo.findUnique({
      where: { id: params.id },
      include: {
        block: {
          include: {
            client: true
          }
        }
      }
    })

    if (!photo) {
      return NextResponse.json({ error: 'Фото не найдено' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && photo.block.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Удаляем файл из Vercel Blob
    try {
      await del(photo.filePath)
    } catch (error) {
      console.error(`Ошибка удаления файла ${photo.filePath}:`, error)
      // Продолжаем даже если не удалось удалить файл
    }

    // Удаляем запись из БД
    await prisma.photo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json({ error: 'Ошибка удаления фото' }, { status: 500 })
  }
} 