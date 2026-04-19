import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'
import { deleteFile } from '@/lib/storage'
import { prisma } from '@/lib/database'
import { getSignedDownloadUrl } from '@/lib/storage'


export const dynamic = 'force-dynamic'

async function withSignedPhotoUrls<T extends { filePath: string }>(photos: T[]): Promise<T[]> {
  return Promise.all(
    photos.map(async (photo) => {
      if (!photo.filePath || photo.filePath.startsWith('http')) {
        return photo
      }

      try {
        const normalizedKey = photo.filePath.replace(/^\/+/, '')
        const signedUrl = await getSignedDownloadUrl(normalizedKey, 3600)
        return { ...photo, filePath: signedUrl }
      } catch (error) {
        console.error('Ошибка генерации signed URL для фото:', photo.filePath, error)
        return photo
      }
    })
  )
}
// GET - получить блок фотографий
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const photoBlock = await prisma.photo_blocks.findUnique({
      where: { id: params.id },
      include: {
        photos: {
          where: { isVisible: true },
          orderBy: { createdAt: 'desc' }
        },
        clients: true
      }
    })

    if (!photoBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    // Проверяем права доступа для менеджеров
    if (session.role === 'MANAGER' && photoBlock.clients.createdBy !== session.id && photoBlock.clients.managerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    return NextResponse.json({
      ...photoBlock,
      photos: await withSignedPhotoUrls(photoBlock.photos)
    })
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
    const session = await checkAuth(request)
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
    const photoBlock = await prisma.photo_blocks.findUnique({
      where: { id: params.id },
      include: { clients: true }
    })

    if (!photoBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && photoBlock.clients.createdBy !== session.id && photoBlock.clients.managerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Обновляем блок
    const updatedBlock = await prisma.photo_blocks.update({
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

    return NextResponse.json({
      ...updatedBlock,
      photos: await withSignedPhotoUrls(updatedBlock.photos)
    })
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
    const session = await checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Получаем блок с фотографиями
    const photoBlock = await prisma.photo_blocks.findUnique({
      where: { id: params.id },
      include: {
        photos: true,
        clients: true
      }
    })

    if (!photoBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && photoBlock.clients.createdBy !== session.id && photoBlock.clients.managerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Удаляем все фото из Vercel Blob
    for (const photo of photoBlock.photos) {
      try {
        await deleteFile(photo.filePath)
      } catch (error) {
        console.error(`Ошибка удаления файла ${photo.filePath}:`, error)
        // Продолжаем даже если не удалось удалить файл
      }
    }

    // Удаляем блок (каскадно удалятся и фото из БД)
    await prisma.photo_blocks.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo block:', error)
    return NextResponse.json({ error: 'Ошибка удаления блока' }, { status: 500 })
  }
} 