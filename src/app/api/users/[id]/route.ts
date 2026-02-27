import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'


export const dynamic = 'force-dynamic'
// GET - получить пользователя по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.users.findUnique({
      where: {
        id: params.id,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        role: true,
        designerType: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Ошибка получения пользователя:', error)
    return NextResponse.json(
      { error: 'Ошибка получения пользователя' },
      { status: 500 }
    )
  }
}

// PUT - обновить пользователя
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { username, password, role, designerType, name, phone, isActive } = await request.json()
    
    // Проверяем существование пользователя
    const existingUser = await prisma.users.findUnique({
      where: { id: params.id }
    })
    
    if (!existingUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }
    
    // Проверяем уникальность username если он изменился
    if (username && username !== existingUser.username) {
      const userWithSameUsername = await prisma.users.findUnique({
        where: { username }
      })
      
      if (userWithSameUsername) {
        return NextResponse.json(
          { error: 'Пользователь с таким именем уже существует' },
          { status: 400 }
        )
      }
    }
    
    // Если дизайнер переводится с INTERNAL на EXTERNAL - отвязываем клиентов
    if (existingUser.role === 'DESIGNER' && 
        existingUser.designerType === 'INTERNAL' && 
        designerType === 'EXTERNAL') {
      await prisma.client.updateMany({
        where: { designerId: params.id },
        data: { designerId: null }
      })
    }
    
    // Хешируем новый пароль если он предоставлен
    let hashedPassword;
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password, 12);
    }
    
    const updatedUser = await prisma.users.update({
      where: { id: params.id },
      data: {
        ...(username && { username }),
        ...(hashedPassword && { passwordHash: hashedPassword }),
        ...(role && { role }),
        ...(role === 'DESIGNER' && designerType && { designerType }),
        ...(role !== 'DESIGNER' && { designerType: null }),
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive })
      },
      select: {
        id: true,
        username: true,
        role: true,
        designerType: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления пользователя' },
      { status: 500 }
    )
  }
}

// DELETE - удалить пользователя
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Мягкое удаление - помечаем как неактивного
    const updatedUser = await prisma.users.update({
      where: { id: params.id },
      data: { isActive: false },
      select: {
        id: true,
        username: true,
        role: true,
        designerType: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления пользователя' },
      { status: 500 }
    )
  }
} 