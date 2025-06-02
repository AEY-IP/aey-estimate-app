import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { Coefficient } from '@/types/estimate'

const dataPath = join(process.cwd(), 'data', 'coefficients.json')

function readCoefficientsData() {
  try {
    const data = readFileSync(dataPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Ошибка чтения файла коэффициентов:', error)
    return { coefficients: [], categories: [] }
  }
}

function writeCoefficientsData(data: any) {
  try {
    writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Ошибка записи файла коэффициентов:', error)
    return false
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = readCoefficientsData()
    
    const coefficientIndex = data.coefficients.findIndex(
      (coef: Coefficient) => coef.id === params.id
    )
    
    if (coefficientIndex === -1) {
      return NextResponse.json(
        { error: 'Коэффициент не найден' },
        { status: 404 }
      )
    }
    
    // Обновляем коэффициент
    data.coefficients[coefficientIndex] = {
      ...data.coefficients[coefficientIndex],
      ...body,
      updatedAt: new Date().toISOString()
    }
    
    if (writeCoefficientsData(data)) {
      return NextResponse.json({ coefficient: data.coefficients[coefficientIndex] })
    } else {
      return NextResponse.json(
        { error: 'Ошибка сохранения коэффициента' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка обновления коэффициента:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления коэффициента' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = readCoefficientsData()
    
    const coefficientIndex = data.coefficients.findIndex(
      (coef: Coefficient) => coef.id === params.id
    )
    
    if (coefficientIndex === -1) {
      return NextResponse.json(
        { error: 'Коэффициент не найден' },
        { status: 404 }
      )
    }
    
    // Удаляем коэффициент
    data.coefficients.splice(coefficientIndex, 1)
    
    if (writeCoefficientsData(data)) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Ошибка удаления коэффициента' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка удаления коэффициента:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления коэффициента' },
      { status: 500 }
    )
  }
} 