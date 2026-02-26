import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    const whereClause: any = {
      isActive: true
    }
    
    if (category && category !== 'all') {
      whereClause.category = category
    }
    
    const coefficients = await prisma.coefficient.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })
    
    // Получаем уникальные категории
    const categories = await prisma.coefficient.groupBy({
      by: ['category'],
      where: { isActive: true }
    })
    
    return NextResponse.json({ 
      coefficients,
      categories: categories.map(c => ({ id: c.category, name: c.category }))
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
    const { name, value, description, category, type } = body
    
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
        category: category || 'custom',
        type: type || 'normal',
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