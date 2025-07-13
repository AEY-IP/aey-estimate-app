import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { showToClient } = body

    // Проверяем, что акт существует
    const act = await prisma.estimate.findUnique({
      where: { 
        id,
        isAct: true 
      }
    })

    if (!act) {
      return NextResponse.json({ error: 'Акт не найден' }, { status: 404 })
    }

    // Для менеджеров проверяем права доступа
    if (session.role === 'MANAGER' && act.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Обновляем видимость акта
    const updatedAct = await prisma.estimate.update({
      where: { id },
      data: { showToClient },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      act: updatedAct 
    })

  } catch (error) {
    console.error('Ошибка переключения видимости акта:', error)
    return NextResponse.json(
      { error: 'Ошибка переключения видимости акта' },
      { status: 500 }
    )
  }
} 