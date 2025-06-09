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

// POST /api/estimates/[id]/rooms - добавить помещение
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Проверяем авторизацию
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const { name } = await request.json()
    
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название помещения обязательно' },
        { status: 400 }
      )
    }
    
    // Проверяем что смета существует и имеет тип "rooms"
    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id }
    })
    
    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    if (estimate.type !== 'rooms') {
      return NextResponse.json(
        { error: 'Нельзя добавлять помещения в смету типа "apartment"' },
        { status: 400 }
      )
    }
    
    // Создаём новое помещение
    const newRoom = await prisma.estimateRoom.create({
      data: {
        name: name.trim(),
        estimateId: params.id,
        totalWorksPrice: 0,
        totalMaterialsPrice: 0,
        totalPrice: 0
      }
    })
    
    // Обновляем время изменения сметы
    await prisma.estimate.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    })
    
    // Формируем полную структуру помещения как ожидает фронтенд
    const fullRoom = {
      id: newRoom.id,
      name: newRoom.name,
      worksBlock: {
        id: `works_${newRoom.id}`,
        title: `Работы - ${newRoom.name}`,
        blocks: [],
        totalPrice: 0
      },
      materialsBlock: {
        id: `materials_${newRoom.id}`,
        title: `Материалы - ${newRoom.name}`,
        items: [],
        totalPrice: 0
      },
      totalWorksPrice: 0,
      totalMaterialsPrice: 0,
      totalPrice: 0,
      manualPrices: [],
      createdAt: newRoom.createdAt,
      updatedAt: newRoom.updatedAt
    }
    
    return NextResponse.json({ room: fullRoom })
  } catch (error) {
    console.error('Ошибка создания помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка создания помещения' },
      { status: 500 }
    )
  }
}

// DELETE /api/estimates/[id]/rooms?roomId=xxx - удалить помещение
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Проверяем авторизацию
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const roomId = url.searchParams.get('roomId')
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'ID помещения обязателен' },
        { status: 400 }
      )
    }
    
    // Проверяем что смета и помещение существуют
    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id }
    })
    
    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    const room = await prisma.estimateRoom.findFirst({
      where: { 
        id: roomId,
        estimateId: params.id
      }
    })
    
    if (!room) {
      return NextResponse.json(
        { error: 'Помещение не найдено' },
        { status: 404 }
      )
    }
    
    // Удаляем помещение (связанные работы и материалы удалятся автоматически через CASCADE)
    await prisma.estimateRoom.delete({
      where: { id: roomId }
    })
    
    // Обновляем время изменения сметы
    await prisma.estimate.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления помещения' },
      { status: 500 }
    )
  }
}

// PUT /api/estimates/[id]/rooms?roomId=xxx - переименовать помещение
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Проверяем авторизацию
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const roomId = url.searchParams.get('roomId')
    const { name } = await request.json()
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'ID помещения обязателен' },
        { status: 400 }
      )
    }
    
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Новое название помещения обязательно' },
        { status: 400 }
      )
    }
    
    // Проверяем что смета и помещение существуют
    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id }
    })
    
    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    const room = await prisma.estimateRoom.findFirst({
      where: { 
        id: roomId,
        estimateId: params.id
      }
    })
    
    if (!room) {
      return NextResponse.json(
        { error: 'Помещение не найдено' },
        { status: 404 }
      )
    }
    
    // Обновляем название помещения
    const updatedRoom = await prisma.estimateRoom.update({
      where: { id: roomId },
      data: { 
        name: name.trim(),
        updatedAt: new Date()
      }
    })
    
    // Обновляем время изменения сметы
    await prisma.estimate.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    })
    
    // Формируем полную структуру помещения как ожидает фронтенд
    const fullRoom = {
      id: updatedRoom.id,
      name: updatedRoom.name,
      worksBlock: {
        id: `works_${updatedRoom.id}`,
        title: `Работы - ${updatedRoom.name}`,
        blocks: [],
        totalPrice: 0
      },
      materialsBlock: {
        id: `materials_${updatedRoom.id}`,
        title: `Материалы - ${updatedRoom.name}`,
        items: [],
        totalPrice: 0
      },
      totalWorksPrice: updatedRoom.totalWorksPrice,
      totalMaterialsPrice: updatedRoom.totalMaterialsPrice,
      totalPrice: updatedRoom.totalPrice,
      manualPrices: [],
      createdAt: updatedRoom.createdAt,
      updatedAt: updatedRoom.updatedAt
    }
    
    return NextResponse.json({ room: fullRoom })
  } catch (error) {
    console.error('Ошибка переименования помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка переименования помещения' },
      { status: 500 }
    )
  }
} 