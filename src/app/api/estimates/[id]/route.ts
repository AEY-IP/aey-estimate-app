import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const dataPath = join(process.cwd(), 'data', 'estimates.json')

function readEstimatesData() {
  try {
    if (!existsSync(dataPath)) {
      return []
    }
    const data = readFileSync(dataPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Ошибка чтения файла смет:', error)
    return []
  }
}

function writeEstimatesData(estimates: any[]) {
  try {
    writeFileSync(dataPath, JSON.stringify(estimates, null, 2), 'utf8')
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
    const estimates = readEstimatesData()
    console.log('estimates:', estimates, 'type:', typeof estimates, 'isArray:', Array.isArray(estimates))
    
    // Проверяем что estimates является массивом
    if (!Array.isArray(estimates)) {
      console.error('estimates не является массивом:', estimates)
      return NextResponse.json(
        { error: 'Ошибка структуры данных' },
        { status: 500 }
      )
    }
    
    const estimate = estimates.find((est: any) => est.id === params.id)
    
    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
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
    const body = await request.json()
    const estimates = readEstimatesData()
    
    const estimateIndex = estimates.findIndex((est: any) => est.id === params.id)
    
    if (estimateIndex === -1) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
    // Обновляем смету
    const updatedEstimate = {
      ...estimates[estimateIndex],
      ...body,
      updatedAt: new Date()
    }
    
    estimates[estimateIndex] = updatedEstimate
    
    if (writeEstimatesData(estimates)) {
      return NextResponse.json(updatedEstimate)
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
    const estimates = readEstimatesData()
    
    const estimateIndex = estimates.findIndex((est: any) => est.id === params.id)
    
    if (estimateIndex === -1) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
    // Удаляем смету из массива
    estimates.splice(estimateIndex, 1)
    
    if (writeEstimatesData(estimates)) {
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