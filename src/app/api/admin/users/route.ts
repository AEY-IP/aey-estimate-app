import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    // Получаем реальных пользователей из базы данных
    const users = await prisma.user.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      users
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 