import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const result = await prisma.user.updateMany({
      where: {
        role: 'DESIGNER',
        designerType: null
      },
      data: {
        designerType: 'INTERNAL'
      }
    })

    return NextResponse.json({ 
      message: `Обновлено ${result.count} дизайнеров на тип INTERNAL`,
      count: result.count
    })
  } catch (error) {
    console.error('Error migrating designers:', error)
    return NextResponse.json({ 
      error: 'Ошибка миграции',
      details: (error as Error).message 
    }, { status: 500 })
  }
}
