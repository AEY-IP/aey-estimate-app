import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { Estimate, Room } from '@/types/estimate'

const dataPath = join(process.cwd(), 'data', 'estimates.json')

function readEstimatesData() {
  try {
    if (!existsSync(dataPath)) {
      return { estimates: [] }
    }
    const data = readFileSync(dataPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Ошибка чтения файла смет:', error)
    return { estimates: [] }
  }
}

function writeEstimatesData(data: any) {
  try {
    writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Ошибка записи файла смет:', error)
    return false
  }
}

// POST /api/estimates/[id]/rooms - добавить новое помещение
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name } = await request.json()
    
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название помещения обязательно' },
        { status: 400 }
      )
    }
    
    const data = readEstimatesData()
    const estimate = data.estimates.find((e: Estimate) => e.id === params.id)
    
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
    
    const newRoom: Room = {
      id: `room_${Date.now()}`,
      name: name.trim(),
      worksBlock: {
        id: `works_${Date.now()}`,
        title: `Работы - ${name.trim()}`,
        blocks: [],
        totalPrice: 0
      },
      materialsBlock: {
        id: `materials_${Date.now()}`,
        title: `Материалы - ${name.trim()}`,
        items: [],
        totalPrice: 0
      },
      totalWorksPrice: 0,
      totalMaterialsPrice: 0,
      totalPrice: 0,
      manualPrices: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    if (!estimate.rooms) {
      estimate.rooms = []
    }
    
    estimate.rooms.push(newRoom)
    estimate.updatedAt = new Date()
    
    if (writeEstimatesData(data)) {
      return NextResponse.json({ room: newRoom })
    } else {
      return NextResponse.json(
        { error: 'Ошибка сохранения помещения' },
        { status: 500 }
      )
    }
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
    const url = new URL(request.url)
    const roomId = url.searchParams.get('roomId')
    
    if (!roomId) {
      return NextResponse.json(
        { error: 'ID помещения обязателен' },
        { status: 400 }
      )
    }
    
    const data = readEstimatesData()
    const estimate = data.estimates.find((e: Estimate) => e.id === params.id)
    
    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    if (estimate.type !== 'rooms' || !estimate.rooms) {
      return NextResponse.json(
        { error: 'Неверный тип сметы или отсутствуют помещения' },
        { status: 400 }
      )
    }
    
    const roomIndex = estimate.rooms.findIndex((room: Room) => room.id === roomId)
    if (roomIndex === -1) {
      return NextResponse.json(
        { error: 'Помещение не найдено' },
        { status: 404 }
      )
    }
    
    estimate.rooms.splice(roomIndex, 1)
    estimate.updatedAt = new Date()
    
    if (writeEstimatesData(data)) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Ошибка удаления помещения' },
        { status: 500 }
      )
    }
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
    
    const data = readEstimatesData()
    const estimate = data.estimates.find((e: Estimate) => e.id === params.id)
    
    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    if (estimate.type !== 'rooms' || !estimate.rooms) {
      return NextResponse.json(
        { error: 'Неверный тип сметы или отсутствуют помещения' },
        { status: 400 }
      )
    }
    
    const room = estimate.rooms.find((room: Room) => room.id === roomId)
    if (!room) {
      return NextResponse.json(
        { error: 'Помещение не найдено' },
        { status: 404 }
      )
    }
    
    room.name = name.trim()
    room.worksBlock.title = `Работы - ${name.trim()}`
    room.materialsBlock.title = `Материалы - ${name.trim()}`
    room.updatedAt = new Date()
    estimate.updatedAt = new Date()
    
    if (writeEstimatesData(data)) {
      return NextResponse.json({ room })
    } else {
      return NextResponse.json(
        { error: 'Ошибка переименования помещения' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка переименования помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка переименования помещения' },
      { status: 500 }
    )
  }
} 