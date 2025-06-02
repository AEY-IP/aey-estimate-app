import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = readEstimatesData()
    const estimate = data.estimates.find((est: any) => est.id === params.id)
    
    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ estimate })
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
    const body = await request.json()
    const data = readEstimatesData()
    
    const estimateIndex = data.estimates.findIndex((est: any) => est.id === params.id)
    
    if (estimateIndex === -1) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
    // Обновляем смету
    const updatedEstimate = {
      ...data.estimates[estimateIndex],
      ...body,
      updatedAt: new Date()
    }
    
    data.estimates[estimateIndex] = updatedEstimate
    
    if (writeEstimatesData(data)) {
      return NextResponse.json({ estimate: updatedEstimate })
    } else {
      return NextResponse.json(
        { error: 'Ошибка сохранения сметы' },
        { status: 500 }
      )
    }
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
    const data = readEstimatesData()
    
    const estimateIndex = data.estimates.findIndex((est: any) => est.id === params.id)
    
    if (estimateIndex === -1) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
    // Удаляем смету из массива
    data.estimates.splice(estimateIndex, 1)
    
    if (writeEstimatesData(data)) {
      return NextResponse.json({ message: 'Смета успешно удалена' })
    } else {
      return NextResponse.json(
        { error: 'Ошибка удаления сметы' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка удаления сметы:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления сметы' },
      { status: 500 }
    )
  }
} 