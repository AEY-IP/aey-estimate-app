import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = readRoomParametersData()
    
    const parameterIndex = data.parameters.findIndex((param: any) => param.id === params.id)
    
    if (parameterIndex === -1) {
      return NextResponse.json(
        { error: 'Параметр не найден' },
        { status: 404 }
      )
    }
    
    const updatedParameter = {
      ...data.parameters[parameterIndex],
      ...body,
      updatedAt: new Date()
    }
    
    data.parameters[parameterIndex] = updatedParameter
    
    if (writeRoomParametersData(data)) {
      return NextResponse.json({ parameter: updatedParameter })
    } else {
      return NextResponse.json(
        { error: 'Ошибка сохранения параметра' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка обновления параметра:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления параметра' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = readRoomParametersData()
    
    const parameterIndex = data.parameters.findIndex((param: any) => param.id === params.id)
    
    if (parameterIndex === -1) {
      return NextResponse.json(
        { error: 'Параметр не найден' },
        { status: 404 }
      )
    }
    
    data.parameters.splice(parameterIndex, 1)
    
    if (writeRoomParametersData(data)) {
      return NextResponse.json({ message: 'Параметр успешно удален' })
    } else {
      return NextResponse.json(
        { error: 'Ошибка удаления параметра' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка удаления параметра:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления параметра' },
      { status: 500 }
    )
  }
} 