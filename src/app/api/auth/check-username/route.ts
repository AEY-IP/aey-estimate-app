import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ 
        available: null, 
        message: 'Логин не указан' 
      }, { status: 400 })
    }

    if (username.length < 3) {
      return NextResponse.json({ 
        available: null, 
        message: 'Минимум 3 символа' 
      })
    }

    // Проверка что логин содержит только допустимые символы
    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!validUsernameRegex.test(username)) {
      return NextResponse.json({ 
        available: null, 
        message: 'Недопустимые символы' 
      }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    return NextResponse.json({ 
      available: !existingUser,
      message: existingUser ? 'Логин уже занят' : 'Логин доступен'
    })
  } catch (error) {
    console.error('Error checking username:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ 
      available: null, 
      message: 'Ошибка проверки. Попробуйте позже.' 
    }, { status: 500 })
  }
}
