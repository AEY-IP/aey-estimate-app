import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const parameters = await prisma.roomParameter.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ parameters })
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
    const { name, description } = await request.json()
    
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Название параметра обязательно' },
        { status: 400 }
      )
    }
    
    const parameter = await prisma.roomParameter.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        isActive: true
      }
    })
    
    return NextResponse.json({ parameter })
  } catch (error) {
    console.error('Ошибка создания параметра помещения:', error)
    return NextResponse.json(
      { error: 'Ошибка создания параметра помещения' },
      { status: 500 }
    )
  }
} 