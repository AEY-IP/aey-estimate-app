import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database'

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

    // Получаем сметы клиента, которые разрешены для показа (исключаем акты)
    const estimates = await (prisma.estimate as any).findMany({
      where: {
        clientId: decoded.clientId,
        showToClient: true,
        isAct: false
      },
      select: {
        id: true,
        title: true,
        category: true,
        totalPrice: true,
        isAct: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      estimates
    })
  } catch (error) {
    console.error('Client estimates error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 