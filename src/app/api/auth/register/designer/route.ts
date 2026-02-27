import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'


export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  let body: any = {}
  
  try {
    body = await request.json()
    const { 
      name, 
      username, 
      password,
      companyName,
      phone,
      resourceLinks 
    } = body

    // Валидация обязательных полей
    if (!name || !username || !password || !companyName || !phone) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      )
    }

    // Валидация логина
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Логин должен содержать только английские буквы, цифры, дефис и подчеркивание' },
        { status: 400 }
      )
    }

    // Валидация пароля
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть не менее 6 символов' },
        { status: 400 }
      )
    }

    const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Пароль должен содержать только английские буквы, цифры и специальные символы' },
        { status: 400 }
      )
    }

    // Проверка существующего username
    const existingUser = await prisma.users.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким логином уже существует' },
        { status: 409 }
      )
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10)

    // Формируем объект ссылок
    let linksObject = null
    if (Array.isArray(resourceLinks) && resourceLinks.length > 0) {
      const filtered = resourceLinks.filter((link: string) => link && link.trim())
      if (filtered.length > 0) {
        linksObject = {}
        filtered.forEach((link: string, idx: number) => {
          linksObject[`link${idx + 1}`] = link.trim()
        })
      }
    }

    // Создаем дизайнера
    const designer = await prisma.users.create({
      data: {
        username,
        passwordHash,
        name,
        phone,
        companyName,
        resourceLinks: linksObject,
        role: 'DESIGNER',
        designerType: 'EXTERNAL',
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна! Теперь вы можете войти в систему',
      designer: {
        id: designer.id,
        name: designer.name,
        username: designer.username
      }
    })
  } catch (error) {
    console.error('=== DESIGNER REGISTRATION ERROR ===')
    console.error('Username:', body?.username)
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    console.error('===================================')
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка регистрации' },
      { status: 500 }
    )
  }
}
