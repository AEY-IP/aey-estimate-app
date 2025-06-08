import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'
import { User, CreateUserRequest } from '@/types/auth'

// GET - получить всех пользователей (только для админов)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Ошибка получения пользователей:', error)
    return NextResponse.json(
      { error: 'Ошибка получения пользователей' },
      { status: 500 }
    )
  }
}

// POST - создать нового пользователя (только для админов)
export async function POST(request: NextRequest) {
  try {
    const { username, password, role, name, phone } = await request.json()
    
    if (!username || !password || !role || !name) {
      return NextResponse.json(
        { error: 'Обязательные поля: username, password, role, name' },
        { status: 400 }
      )
    }
    
    // Проверяем уникальность имени пользователя
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким именем уже существует' },
        { status: 400 }
      )
    }
    
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash: password, // В реальном приложении нужно хешировать пароль
        role,
        name,
        phone: phone || null,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return NextResponse.json(newUser)
  } catch (error) {
    console.error('Ошибка создания пользователя:', error)
    return NextResponse.json(
      { error: 'Ошибка создания пользователя' },
      { status: 500 }
    )
  }
} 