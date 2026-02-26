import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth, canAccessMainSystem } from '@/lib/auth'


export const dynamic = 'force-dynamic'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к параметрам помещений
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const parameter = await prisma.roomParameter.findUnique({
      where: { id: params.id }
    })
    
    if (!parameter) {
      return NextResponse.json(
        { error: 'Параметр не найден' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ parameter })
  } catch (error) {
    console.error('Ошибка получения параметра помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка получения параметра помещения' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к параметрам помещений
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const { name, unit, description, isActive } = await request.json()
    
    const updatedParameter = await prisma.roomParameter.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(unit && { unit: unit.trim() }),
        ...(description !== undefined && { description: description?.trim() || '' }),
        ...(isActive !== undefined && { isActive })
      }
    })
    
    return NextResponse.json({ parameter: updatedParameter })
  } catch (error) {
    console.error('Ошибка обновления параметра помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления параметра помещения' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к параметрам помещений
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    await prisma.roomParameter.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления параметра помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления параметра помещения' },
      { status: 500 }
    )
  }
} 