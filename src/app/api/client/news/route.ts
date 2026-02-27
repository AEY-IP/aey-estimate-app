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

    const clientId = decoded.clientId

    // Получаем новости для клиента
    const news = await prisma.project_news.findMany({
      where: { 
        clientId: clientId
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    })

    return NextResponse.json({
      news
    })
  } catch (error) {
    console.error('Client news error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 