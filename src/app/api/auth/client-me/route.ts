import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    console.log('=== CLIENT-ME API START ===')
    const token = request.cookies.get('client-token')?.value
    console.log('Client token exists:', !!token)

    if (!token) {
      console.log('No client token found')
      return NextResponse.json(
        { error: 'Клиент не авторизован' },
        { status: 401 }
      )
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    console.log('Token decoded:', { clientUserId: decoded.clientUserId, clientId: decoded.clientId, username: decoded.username })

    if (decoded.type !== 'client') {
      console.log('Invalid token type:', decoded.type)
      return NextResponse.json(
        { error: 'Неверный тип токена' },
        { status: 401 }
      )
    }

    // Получаем данные клиента
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: decoded.clientUserId },
      include: {
        client: true
      }
    })

    console.log('ClientUser found:', !!clientUser)
    if (clientUser) {
      console.log('Client data:', { id: clientUser.client.id, name: clientUser.client.name, username: clientUser.username })
    }

    if (!clientUser || !clientUser.isActive) {
      console.log('ClientUser not found or inactive')
      return NextResponse.json(
        { error: 'Клиент не найден или заблокирован' },
        { status: 401 }
      )
    }

    const response = {
      client: {
        id: clientUser.client.id,
        name: clientUser.client.name
      },
      user: {
        id: clientUser.client.id,
        name: clientUser.client.name,
        username: clientUser.username,
        role: 'CLIENT'
      },
      isAuthenticated: true
    }
    
    console.log('Returning client data:', response)
    console.log('=== CLIENT-ME API END ===')
    return NextResponse.json(response)

  } catch (error) {
    console.error('Client auth error:', error)
    return NextResponse.json(
      { error: 'Ошибка авторизации' },
      { status: 401 }
    )
  }
} 