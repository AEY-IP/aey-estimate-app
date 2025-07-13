import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

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
    const { newPassword } = await request.json()

    if (!newPassword?.trim()) {
      return NextResponse.json({ error: 'Пароль не может быть пустым' }, { status: 400 })
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'Пароль должен быть не менее 4 символов' }, { status: 400 })
    }

    // Проверяем, что клиент существует и принадлежит текущему пользователю
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        createdBy: session.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    // Хешируем пароль для безопасного хранения
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Обновляем пароль в базе данных
    await prisma.clientUser.update({
      where: {
        clientId: clientId
      },
      data: {
        passwordHash: hashedPassword,
        plainPassword: newPassword // Сохраняем также в открытом виде для удобства
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Пароль успешно изменен'
    })

  } catch (error) {
    console.error('Error changing client password:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 