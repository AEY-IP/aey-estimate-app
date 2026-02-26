import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      )
    }

    // Найти клиента по логину
    const clientUser = await prisma.clientUser.findUnique({
      where: { username },
      include: {
        client: true
      }
    })

    if (!clientUser || !clientUser.isActive) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    // Проверить пароль
    const isValidPassword = await bcrypt.compare(password, clientUser.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    // Создать JWT токен
    const token = jwt.sign(
      { 
        clientUserId: clientUser.id,
        clientId: clientUser.clientId,
        username: clientUser.username,
        type: 'client'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Создать ответ с токеном в cookie
    const response = NextResponse.json({
      success: true,
      client: {
        id: clientUser.client.id,
        name: clientUser.client.name,
        username: clientUser.username
      }
    })

    response.cookies.set('client-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 дней
    })

    return response
  } catch (error) {
    console.error('Client login error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 