import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password, name } = await request.json()

    if (!username || !password || !name) {
      return NextResponse.json({ 
        error: 'Укажите username, password и name' 
      }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'DESIGNER' }
      })

      return NextResponse.json({ 
        message: 'Пользователь уже существует, роль обновлена на DESIGNER',
        user: {
          username: existingUser.username,
          name: existingUser.name,
          role: 'DESIGNER'
        }
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name,
        role: 'DESIGNER',
        isActive: true
      }
    })

    return NextResponse.json({ 
      message: 'Дизайнер создан',
      user: {
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Error creating designer:', error)
    return NextResponse.json({ 
      error: 'Ошибка создания дизайнера',
      details: (error as Error).message 
    }, { status: 500 })
  }
}
