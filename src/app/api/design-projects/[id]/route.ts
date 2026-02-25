import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkAuth } from '@/lib/auth'
import { deleteFile } from '@/lib/storage'

const prisma = new PrismaClient()

// GET - получить блок дизайн-проекта
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const designProjectBlock = await (prisma as any).designProjectBlock.findUnique({
      where: { id: params.id },
      include: {
        files: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' }
        },
        client: true
      }
    })

    if (!designProjectBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    // Проверяем права доступа
    if (session.role === 'DESIGNER' && designProjectBlock.client.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role === 'MANAGER' && designProjectBlock.client.managerId !== session.id && designProjectBlock.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    return NextResponse.json(designProjectBlock)
  } catch (error) {
    console.error('Error fetching design project block:', error)
    return NextResponse.json({ error: 'Ошибка загрузки блока' }, { status: 500 })
  }
}

// PUT - редактировать блок дизайн-проекта
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
    const designProjectBlock = await (prisma as any).designProjectBlock.findUnique({
      where: { id: params.id },
      include: { client: true }
    })

    if (!designProjectBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    // Только ADMIN и DESIGNER могут редактировать
    if (session.role === 'DESIGNER' && designProjectBlock.client.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role === 'MANAGER') {
      return NextResponse.json({ error: 'Менеджеры не могут редактировать блоки дизайн-проектов' }, { status: 403 })
    }

    // Обновляем блок
    const updatedBlock = await (prisma as any).designProjectBlock.update({
      where: { id: params.id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        files: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json(updatedBlock)
  } catch (error) {
    console.error('Error updating design project block:', error)
    return NextResponse.json({ error: 'Ошибка обновления блока' }, { status: 500 })
  }
}

// DELETE - удалить блок дизайн-проекта
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Получаем блок с файлами
    const designProjectBlock = await (prisma as any).designProjectBlock.findUnique({
      where: { id: params.id },
      include: {
        files: true,
        client: true
      }
    })

    if (!designProjectBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    // Только ADMIN и DESIGNER могут удалять
    if (session.role === 'DESIGNER' && designProjectBlock.client.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role === 'MANAGER') {
      return NextResponse.json({ error: 'Менеджеры не могут удалять блоки дизайн-проектов' }, { status: 403 })
    }

    // Удаляем все файлы из Yandex Cloud
    for (const file of designProjectBlock.files) {
      try {
        await deleteFile(file.filePath)
      } catch (error) {
        console.error(`Ошибка удаления файла ${file.filePath}:`, error)
        // Продолжаем даже если не удалось удалить файл
      }
    }

    // Удаляем блок (каскадно удалятся и файлы из БД)
    await (prisma as any).designProjectBlock.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting design project block:', error)
    return NextResponse.json({ error: 'Ошибка удаления блока' }, { status: 500 })
  }
}

