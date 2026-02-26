import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('client-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    if (decoded.type !== 'client') {
      return NextResponse.json(
        { error: 'Неверный тип токена' },
        { status: 401 }
      )
    }

    const clientUser = await prisma.clientUser.findUnique({
      where: { id: decoded.clientUserId },
      include: {
        client: true
      }
    })

    if (!clientUser || !clientUser.isActive) {
      return NextResponse.json(
        { error: 'Клиент не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      client: {
        id: clientUser.client.id,
        name: clientUser.client.name,
        username: clientUser.username
      }
    })
  } catch (error) {
    console.error('Client profile error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 