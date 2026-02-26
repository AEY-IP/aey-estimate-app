import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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
      user: {
        id: session.id,
        name: session.name || session.username, // Используем name если есть, иначе username
        username: session.username,
        role: session.role,
        designerType: session.designerType
      },
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