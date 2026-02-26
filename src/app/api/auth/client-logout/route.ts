import { NextResponse } from 'next/server'


export const dynamic = 'force-dynamic'
export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Выход выполнен успешно'
    })

    // Удаляем токен клиента
    response.cookies.set('client-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Удаляем cookie
    })

    return response
  } catch (error) {
    console.error('Client logout error:', error)
    return NextResponse.json(
      { error: 'Ошибка выхода' },
      { status: 500 }
    )
  }
} 