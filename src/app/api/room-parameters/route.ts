import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth, canAccessMainSystem } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к параметрам помещений
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const parameters = await prisma.roomParameter.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ parameters })
  } catch (error) {
    console.error('Ошибка получения параметров помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка получения параметров помещения' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к параметрам помещений
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { name, unit, description } = await request.json()
    
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название параметра обязательно' },
        { status: 400 }
      )
    }
    
    if (!unit?.trim()) {
      return NextResponse.json(
        { error: 'Единица измерения обязательна' },
        { status: 400 }
      )
    }
    
    const parameter = await prisma.roomParameter.create({
      data: {
        name: name.trim(),
        unit: unit.trim(),
        description: description?.trim() || '',
        isActive: true
      }
    })
    
    return NextResponse.json({ parameter })
  } catch (error) {
    console.error('Ошибка создания параметра помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка создания параметра помещения' },
      { status: 500 }
    )
  }
} 