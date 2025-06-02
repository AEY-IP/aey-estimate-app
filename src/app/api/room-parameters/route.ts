import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { RoomParameter } from '@/types/estimate'

const dataPath = join(process.cwd(), 'data', 'room-parameters.json')

function readRoomParametersData() {
  try {
    if (!existsSync(dataPath)) {
      return { parameters: [] }
    }
    const data = readFileSync(dataPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Ошибка чтения файла параметров помещения:', error)
    return { parameters: [] }
  }
}

function writeRoomParametersData(data: any) {
  try {
    writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Ошибка записи файла параметров помещения:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const data = readRoomParametersData()
    return NextResponse.json({ parameters: data.parameters })
  } catch (error) {
    console.error('Ошибка получения параметров помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка получения параметров помещения' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, unit, description } = body
    
    if (!name || !unit) {
      return NextResponse.json(
        { error: 'Обязательные поля: name, unit' },
        { status: 400 }
      )
    }
    
    const data = readRoomParametersData()
    
    const newParameter: RoomParameter = {
      id: `param_${Date.now()}`,
      name,
      unit,
      description: description || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    data.parameters.push(newParameter)
    
    if (writeRoomParametersData(data)) {
      return NextResponse.json({ parameter: newParameter })
    } else {
      return NextResponse.json(
        { error: 'Ошибка сохранения параметра' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка создания параметра помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка создания параметра помещения' },
      { status: 500 }
    )
  }
} 