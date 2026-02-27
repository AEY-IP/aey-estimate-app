import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
// Функция генерации случайного пароля
function generatePassword(length: number = 6): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Функция генерации логина
function generateUsername(clientName: string): string {
  // Берем первые буквы слов и добавляем случайные цифры
  const words = clientName.split(' ').filter(word => word.length > 0)
  let username = words.map(word => word[0].toLowerCase()).join('')
  username += Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return username
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    // Проверяем, существует ли клиент
    const client = await prisma.clients.findUnique({
      where: { id: clientId },
      include: { clientUser: true }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Клиент не найден' },
        { status: 404 }
      )
    }

    // Проверяем, есть ли уже доступ
    if (client.clientUser) {
      return NextResponse.json(
        { error: 'Доступ к кабинету уже создан' },
        { status: 400 }
      )
    }

    // Генерируем логин и пароль
    let username = generateUsername(client.name)
    
    // Проверяем уникальность логина
    let attempts = 0
    while (attempts < 10) {
      const existingUser = await prisma.clientUser.findUnique({
        where: { username }
      })
      
      if (!existingUser) break
      
      username = generateUsername(client.name)
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Не удалось сгенерировать уникальный логин' },
        { status: 500 }
      )
    }

    const password = generatePassword()
    const passwordHash = await bcrypt.hash(password, 10)

    // Создаем доступ к кабинету
    const clientUser = await prisma.clientUser.create({
      data: {
        username,
        passwordHash,
        plainPassword: password,
        clientId
      }
    })

    return NextResponse.json({
      success: true,
      credentials: {
        username,
        password
      }
    })
  } catch (error) {
    console.error('Create client access error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 