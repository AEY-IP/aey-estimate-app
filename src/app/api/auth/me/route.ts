import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authSession = request.cookies.get('auth-session')
    
    if (!authSession || !authSession.value) {
      return NextResponse.json(
        { error: 'Пользователь не авторизован' },
        { status: 401 }
      )
    }
    
    const user = JSON.parse(authSession.value)
    
    return NextResponse.json({
      user,
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