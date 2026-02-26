import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    // Валидация входных данных
    if (!username) {
      return NextResponse.json({ 
        available: null, 
        message: 'Логин не указан' 
      })
    }

    if (username.length < 3) {
      return NextResponse.json({ 
        available: null, 
        message: 'Минимум 3 символа' 
      })
    }

    // Проверка допустимых символов
    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!validUsernameRegex.test(username)) {
      return NextResponse.json({ 
        available: null, 
        message: 'Недопустимые символы' 
      })
    }

    // Проверка существования пользователя - запрашиваем только username
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true } // Запрашиваем только id для минимизации нагрузки
    })

    // Возвращаем результат
    return NextResponse.json({ 
      available: !existingUser,
      message: existingUser ? 'Логин уже занят' : 'Логин доступен'
    })
  } catch (error) {
    // Подробное логирование ошибки
    console.error('=== USERNAME CHECK ERROR ===')
    console.error('Username:', request.nextUrl.searchParams.get('username'))
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    console.error('===========================')
    
    // Возвращаем нейтральный результат вместо ошибки
    return NextResponse.json({ 
      available: null, 
      message: '' 
    })
  }
}
