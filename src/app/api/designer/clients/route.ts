import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'


export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const where: any = { isActive: true }

    if (session.role === 'DESIGNER') {
      where.designerId = session.id
    } else if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const clients = await prisma.designerClient.findMany({
      where,
      include: {
        designer: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        estimates: {
          where: { isActive: true },
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Error fetching designer clients:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    console.log('🔍 POST /api/designer/clients - Session:', { 
      id: session.id, 
      username: session.username,
      role: session.role 
    })

    if (session.role !== 'DESIGNER' && session.role !== 'ADMIN') {
      console.log('❌ Access denied. Required: DESIGNER or ADMIN, got:', session.role)
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, email, address, notes } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название клиента обязательно' }, { status: 400 })
    }

    const designerId = session.role === 'DESIGNER' ? session.id : body.designerId
    if (!designerId) {
      return NextResponse.json({ error: 'Не указан дизайнер' }, { status: 400 })
    }

    const client = await prisma.designerClient.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        designerId
      },
      include: {
        designer: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error creating designer client:', error)
    return NextResponse.json({ error: 'Ошибка создания клиента' }, { status: 500 })
  }
}
