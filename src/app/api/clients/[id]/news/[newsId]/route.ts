import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'

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