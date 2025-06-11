import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'
import { LoginRequest } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { username, password } = body
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      )
    }
    
    const user = await prisma.user.findUnique({
      where: { 
        username: username,
      },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    })
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }
    
    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }
    
    // Создаем сессию (без пароля)
    const userSession = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      phone: user.phone,
      createdAt: user.createdAt,
      isActive: user.isActive
    }
    
    console.log('Login successful for user:', user.id)
    
    // Создаем response с cookie
    const response = NextResponse.json({ 
      user: userSession,
      message: 'Вход выполнен успешно' 
    })
    
    // Устанавливаем cookie с сессией (на 7 дней)
    // Кодируем в base64 для совместимости с checkAuth
    const sessionJson = JSON.stringify(userSession)
    const sessionBase64 = Buffer.from(sessionJson, 'utf-8').toString('base64')
    
    response.cookies.set('auth-session', sessionBase64, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 дней
    })
    
    return response
    
  } catch (error) {
    console.error('Ошибка входа:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
} 