import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; newsId: string } }
) {
  try {
    const session = await checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id: clientId, newsId } = params
    const { title, content, comment, type } = await request.json()

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Заголовок и содержание обязательны' },
        { status: 400 }
      )
    }

    // Валидация типа новости
    const validTypes = ['work', 'materials', 'admin', 'other']
    const newsType = validTypes.includes(type) ? type : 'other'

    // Проверяем, что новость существует и принадлежит этому клиенту
    const newsItem = await prisma.projectNews.findFirst({
      where: {
        id: newsId,
        clientId: clientId
      },
      include: {
        client: true
      }
    })

    if (!newsItem) {
      return NextResponse.json(
        { error: 'Новость не найдена' },
        { status: 404 }
      )
    }

    // Проверяем права доступа для менеджеров
    if (session.role === 'MANAGER' && newsItem.client.createdBy !== session.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Обновляем новость
    const updatedNewsItem = await prisma.projectNews.update({
      where: { id: newsId },
      data: {
        title: title.trim(),
        content: content.trim(),
        comment: comment?.trim() || null,
        type: newsType,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedNewsItem)
  } catch (error) {
    console.error('Error updating client news:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления новости' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; newsId: string } }
) {
  try {
    const session = await checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id: clientId, newsId } = params

    // Проверяем, что новость существует и принадлежит этому клиенту
    const newsItem = await prisma.projectNews.findFirst({
      where: {
        id: newsId,
        clientId: clientId
      }
    })

    if (!newsItem) {
      return NextResponse.json(
        { error: 'Новость не найдена' },
        { status: 404 }
      )
    }

    // Удаляем новость
    await prisma.projectNews.delete({
      where: { id: newsId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client news:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления новости' },
      { status: 500 }
    )
  }
} 