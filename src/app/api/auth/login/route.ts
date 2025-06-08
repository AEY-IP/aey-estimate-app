import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcryptjs'
import { User, LoginRequest } from '@/types/auth'

const usersPath = join(process.cwd(), 'data', 'users.json')

function readUsersData() {
  try {
    if (!existsSync(usersPath)) {
      return []
    }
    const data = readFileSync(usersPath, 'utf8')
    const parsed = JSON.parse(data)
    // Если это массив, возвращаем его, если объект с users - возвращаем users
    return Array.isArray(parsed) ? parsed : (parsed.users || [])
  } catch (error) {
    console.error('Ошибка чтения файла пользователей:', error)
    return []
  }
}

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
    
    const data = readUsersData()
    const user = data.find((u: User) => u.username === username && u.isActive)
    
    if (!user) {
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
      email: user.email,
      createdAt: user.createdAt,
      isActive: user.isActive
    }
    
    // Создаем response с cookie
    const response = NextResponse.json({ 
      user: userSession,
      message: 'Вход выполнен успешно' 
    })
    
    // Устанавливаем cookie с сессией (на 7 дней)
    response.cookies.set('auth-session', JSON.stringify(userSession), {
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