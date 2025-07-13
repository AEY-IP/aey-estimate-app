import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const clientId = params.id

    // Получаем новости клиента
    const news = await prisma.projectNews.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error('Error fetching client news:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки новостей' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const clientId = params.id
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

    // Проверяем, что клиент существует
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Клиент не найден' },
        { status: 404 }
      )
    }

    // Создаем новость
    const newsItem = await prisma.projectNews.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        comment: comment?.trim() || null,
        type: newsType,
        clientId
      }
    })

    return NextResponse.json(newsItem)
  } catch (error) {
    console.error('Error creating client news:', error)
    return NextResponse.json(
      { error: 'Ошибка создания новости' },
      { status: 500 }
    )
  }
} 