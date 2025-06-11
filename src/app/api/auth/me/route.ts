import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = checkAuth(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Пользователь не авторизован' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      user: session,
      isAuthenticated: true
    })
    
  } catch (error) {
    console.error('Ошибка получения пользователя:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
} 