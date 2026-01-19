import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { name, phone, services, contactMethods } = body

    // Валидация
    if (!name || !phone || !services || !contactMethods) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      )
    }

    if (services.length === 0) {
      return NextResponse.json(
        { error: 'Выберите хотя бы одну услугу' },
        { status: 400 }
      )
    }

    if (contactMethods.length === 0) {
      return NextResponse.json(
        { error: 'Выберите хотя бы один способ связи' },
        { status: 400 }
      )
    }

    // Создаем заявку
    const leadRequest = await prisma.leadRequest.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        services,
        contactMethods,
        status: 'new'
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        leadRequest 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating lead request:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании заявки' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = status ? { status } : {}

    const leadRequests = await prisma.leadRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ leadRequests })
  } catch (error) {
    console.error('Error fetching lead requests:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении заявок' },
      { status: 500 }
    )
  }
}


