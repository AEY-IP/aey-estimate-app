import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

// Проверка авторизации
async function checkAuth() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('auth-session')
  
  if (!sessionCookie) {
    return null
  }
  
  try {
    const sessionData = JSON.parse(sessionCookie.value)
    return sessionData
  } catch (error) {
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    console.log('=== ESTIMATE API GET START ===')
    console.log('Requested estimate ID:', params.id)
    console.log('Session data:', session)

    // Ищем смету в базе данных
    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        rooms: true,
        coefficients: true
      }
    })

    console.log('Database query result:', estimate ? { id: estimate.id, title: estimate.title } : 'null')

    if (!estimate) {
      console.log('Estimate not found')
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    console.log('Estimate access granted, returning data')
    console.log('=== ESTIMATE API GET END ===')
    
    return NextResponse.json(estimate)
  } catch (error) {
    console.error('Ошибка получения сметы:', error)
    return NextResponse.json(
      { error: 'Ошибка получения сметы' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Проверяем что смета существует
    const existingEstimate = await prisma.estimate.findUnique({
      where: { id: params.id }
    })
    
    if (!existingEstimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
    // Обновляем смету
    const updatedEstimate = await prisma.estimate.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date()
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        rooms: true,
        coefficients: true
      }
    })
    
    return NextResponse.json(updatedEstimate)
  } catch (error) {
    console.error('Ошибка обновления сметы:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления сметы' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }
    
    // Проверяем что смета существует
    const existingEstimate = await prisma.estimate.findUnique({
      where: { id: params.id }
    })
    
    if (!existingEstimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
    // Удаляем смету
    await prisma.estimate.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Смета успешно удалена' })
  } catch (error) {
    console.error('Ошибка удаления сметы:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления сметы' },
      { status: 500 }
    )
  }
} 