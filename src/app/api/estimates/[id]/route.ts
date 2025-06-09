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

// Формирует полную структуру помещения как ожидает фронтенд
function formatRoomForFrontend(room: any) {
  return {
    id: room.id,
    name: room.name,
    worksBlock: {
      id: `works_${room.id}`,
      title: `Работы - ${room.name}`,
      blocks: [], // TODO: загружать реальные блоки работ из базы
      totalPrice: 0
    },
    materialsBlock: {
      id: `materials_${room.id}`,
      title: `Материалы - ${room.name}`,
      items: [], // TODO: загружать реальные материалы из базы
      totalPrice: 0
    },
    totalWorksPrice: room.totalWorksPrice,
    totalMaterialsPrice: room.totalMaterialsPrice,
    totalPrice: room.totalPrice,
    manualPrices: [],
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
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
    
    // Форматируем данные для фронтенда
    const formattedEstimate: any = {
      ...estimate,
      rooms: estimate.rooms ? estimate.rooms.map(formatRoomForFrontend) : []
    }
    
    // Для смет типа "rooms" добавляем сводные блоки если их нет
    if (estimate.type === 'rooms') {
      if (!formattedEstimate.summaryWorksBlock) {
        formattedEstimate.summaryWorksBlock = {
          id: `summary_works_${estimate.id}`,
          title: "Сводная смета - Работы",
          blocks: [],
          totalPrice: 0
        }
      }
      if (!formattedEstimate.summaryMaterialsBlock) {
        formattedEstimate.summaryMaterialsBlock = {
          id: `summary_materials_${estimate.id}`,
          title: "Сводная смета - Материалы", 
          items: [],
          totalPrice: 0
        }
      }
    }
    
    return NextResponse.json(formattedEstimate)
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

    console.log('=== ESTIMATE API PUT START ===')
    console.log('Estimate ID:', params.id)
    console.log('User:', session.username)
    
    const body = await request.json()
    console.log('Request body keys:', Object.keys(body))
    
    // Проверяем что смета существует
    const existingEstimate = await prisma.estimate.findUnique({
      where: { id: params.id }
    })
    
    if (!existingEstimate) {
      console.log('Estimate not found')
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
    // Фильтруем только допустимые поля для модели Estimate
    const allowedFields = [
      'title', 'type', 'category', 'totalWorksPrice', 
      'totalMaterialsPrice', 'totalPrice', 'status', 'notes'
    ]
    
    const updateData: any = {}
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }
    
    // Добавляем updatedAt
    updateData.updatedAt = new Date()
    
    console.log('Filtered update data:', updateData)
    
    // Обновляем смету
    const updatedEstimate = await prisma.estimate.update({
      where: { id: params.id },
      data: updateData,
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
    
    console.log('Estimate updated successfully')
    
    // Форматируем данные для фронтенда
    const formattedEstimate: any = {
      ...updatedEstimate,
      rooms: updatedEstimate.rooms ? updatedEstimate.rooms.map(formatRoomForFrontend) : []
    }
    
    // Для смет типа "rooms" добавляем сводные блоки если их нет
    if (updatedEstimate.type === 'rooms') {
      if (!formattedEstimate.summaryWorksBlock) {
        formattedEstimate.summaryWorksBlock = {
          id: `summary_works_${updatedEstimate.id}`,
          title: "Сводная смета - Работы",
          blocks: [],
          totalPrice: 0
        }
      }
      if (!formattedEstimate.summaryMaterialsBlock) {
        formattedEstimate.summaryMaterialsBlock = {
          id: `summary_materials_${updatedEstimate.id}`,
          title: "Сводная смета - Материалы", 
          items: [],
          totalPrice: 0
        }
      }
    }
    
    console.log('=== ESTIMATE API PUT END ===')
    return NextResponse.json(formattedEstimate)
  } catch (error) {
    console.error('=== ESTIMATE API PUT ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
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