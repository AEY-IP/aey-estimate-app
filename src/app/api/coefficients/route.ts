import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { Coefficient, CoefficientCategory } from '@/types/estimate'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const categoriesOnly = searchParams.get('categories')
    
    const data = readCoefficientsData()
    
    if (categoriesOnly === 'true') {
      return NextResponse.json({ categories: data.categories })
    }
    
    let coefficients = data.coefficients
    
    if (category && category !== 'all') {
      coefficients = coefficients.filter((coef: Coefficient) => coef.category === category)
    }
    
    return NextResponse.json({ 
      coefficients,
      categories: data.categories
    })
  } catch (error) {
    console.error('Ошибка получения коэффициентов:', error)
    return NextResponse.json(
      { error: 'Ошибка получения коэффициентов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, value, description, category } = body
    
    if (!name || value === undefined || !category) {
      return NextResponse.json(
        { error: 'Обязательные поля: name, value, category' },
        { status: 400 }
      )
    }
    
    const data = readCoefficientsData()
    
    const newCoefficient: Coefficient = {
      id: `coef_${Date.now()}`,
      name,
      value: parseFloat(value),
      description: description || '',
      category,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    data.coefficients.push(newCoefficient)
    
    if (writeCoefficientsData(data)) {
      return NextResponse.json({ coefficient: newCoefficient })
    } else {
      return NextResponse.json(
        { error: 'Ошибка сохранения коэффициента' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка создания коэффициента:', error)
    return NextResponse.json(
      { error: 'Ошибка создания коэффициента' },
      { status: 500 }
    )
  }
} 