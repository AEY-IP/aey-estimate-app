import { NextResponse } from 'next/server'


export const dynamic = 'force-dynamic'
export async function POST() {
  const response = NextResponse.json({ message: 'Выход выполнен успешно' })
  
  // Удаляем cookie с сессией
  response.cookies.set('auth-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0 // Удаляем cookie
  })
  
  return response
} 