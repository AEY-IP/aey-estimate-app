import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    const coefficients = await prisma.coefficient.findMany({
      where: {
        isActive: true
      }
    })
    
    return NextResponse.json({ 
      coefficients,
      categories: [] // У нас нет отдельной таблицы категорий пока
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
    const { name, value, description } = body
    
    if (!name || value === undefined) {
      return NextResponse.json(
        { error: 'Обязательные поля: name, value' },
        { status: 400 }
      )
    }
    
    const newCoefficient = await prisma.coefficient.create({
      data: {
        name,
        value: parseFloat(value),
        description: description || null,
        isActive: true
      }
    })
    
    return NextResponse.json({ coefficient: newCoefficient })
  } catch (error) {
    console.error('Ошибка создания коэффициента:', error)
    return NextResponse.json(
      { error: 'Ошибка создания коэффициента' },
      { status: 500 }
    )
  }
} 