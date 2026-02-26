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

    // Получаем данные клиента через clientId из токена
    const client = await prisma.client.findUnique({
      where: { id: decoded.clientId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        contractNumber: true,
        contractDate: true,
        createdAt: true,
        isActive: true
      }
    })

    if (!client || !client.isActive) {
      return NextResponse.json(
        { error: 'Клиент не найден или заблокирован' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      client
    })
  } catch (error) {
    console.error('Client profile details error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 