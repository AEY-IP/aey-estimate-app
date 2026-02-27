import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'


export const dynamic = 'force-dynamic'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем аутентификацию
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const clientId = params.id

    // Проверяем, существует ли клиент и есть ли доступ
    const client = await prisma.clients.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    // Проверяем права доступа для менеджеров
    if (session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Ищем информацию о кабинете клиента
    const clientUser = await prisma.client_users.findUnique({
      where: { clientId }
    })

    return NextResponse.json({
      hasAccess: !!clientUser,
      username: clientUser?.username || null,
      isActive: clientUser?.isActive || false,
      password: clientUser?.plainPassword || null
    })
  } catch (error) {
    console.error('Cabinet info error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 