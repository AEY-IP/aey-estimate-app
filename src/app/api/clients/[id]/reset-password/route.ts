import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'
import bcrypt from 'bcryptjs'


export const dynamic = 'force-dynamic'
// Функция генерации случайного пароля
function generatePassword(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
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

    // Проверяем, что клиент существует и принадлежит текущему пользователю
    const client = await prisma.clients.findFirst({
      where: {
        id: clientId,
        createdBy: session.id
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    // Генерируем новый пароль
    const newPassword = generatePassword()
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Обновляем пароль в базе данных
    await prisma.client_users.update({
      where: {
        clientId: clientId
      },
      data: {
        passwordHash: hashedPassword
      }
    })

    return NextResponse.json({ 
      success: true,
      newPassword: newPassword
    })

  } catch (error) {
    console.error('Error resetting client password:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 