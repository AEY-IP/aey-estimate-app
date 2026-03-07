import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth, canAccessMainSystem } from '@/lib/auth'


export const dynamic = 'force-dynamic'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к актам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const act = await prisma.estimates.findUnique({
      where: { id: params.id },
      include: {
        clients: {
          select: {
            id: true,
            name: true
          }
        },
        users: {
          select: {
            id: true,
            name: true
          }
        },
        estimate_exports: true,
        estimate_rooms: {
          include: {
            estimate_works: {
              include: {
                work_items: true
              }
            },
            estimate_materials: true,
            estimate_room_parameter_values: {
              include: {
                room_parameters: true
              }
            }
          }
        },
        estimate_coefficients: true,
        estimate_room_parameter_values: {
          include: {
            room_parameters: true
          }
        }
      }
    })

    if (!act || !act.isAct) {
      return NextResponse.json({ error: 'Акт не найден' }, { status: 404 })
    }

    return NextResponse.json({
      ...act,
      client: act.clients,
      creator: act.users,
      exportCache: act.estimate_exports,
      rooms: act.estimate_rooms.map((room: any) => ({
        ...room,
        works: room.estimate_works.map((work: any) => ({
          ...work,
          workItem: work.work_items
        })),
        materials: room.estimate_materials,
        roomParameterValues: room.estimate_room_parameter_values.map((v: any) => ({
          ...v,
          parameter: v.room_parameters
        }))
      })),
      coefficients: act.estimate_coefficients,
      roomParameterValues: act.estimate_room_parameter_values.map((v: any) => ({
        ...v,
        parameter: v.room_parameters
      }))
    })

  } catch (error) {
    console.error('Ошибка получения акта:', error)
    return NextResponse.json(
      { error: 'Ошибка получения акта' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к актам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const data = await request.json()

    const existingAct = await prisma.estimates.findUnique({
      where: { id: params.id }
    })

    if (!existingAct || !existingAct.isAct) {
      return NextResponse.json({ error: 'Акт не найден' }, { status: 404 })
    }

    const act = await prisma.estimates.update({
      where: { id: params.id },
      data: {
        title: data.title,
        type: data.type,
        category: data.category,
        notes: data.notes,
        showToClient: data.showToClient,
        totalWorksPrice: data.totalWorksPrice || 0,
        totalMaterialsPrice: data.totalMaterialsPrice || 0,
        totalPrice: data.totalPrice || 0,
        coefficientSettings: data.coefficientSettings,
        coefficientsData: data.coefficientsData,
        manualPrices: data.manualPrices,
        materialsBlock: data.materialsBlock,
        summaryMaterialsBlock: data.summaryMaterialsBlock,
        summaryWorksBlock: data.summaryWorksBlock,
        worksBlock: data.worksBlock,
        updatedAt: new Date()
      },
      include: {
        clients: {
          select: {
            id: true,
            name: true
          }
        },
        users: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      ...act,
      client: act.clients,
      creator: act.users
    })

  } catch (error) {
    console.error('Ошибка обновления акта:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления акта' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к актам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const existingAct = await prisma.estimates.findUnique({
      where: { id: params.id }
    })

    if (!existingAct || !existingAct.isAct) {
      return NextResponse.json({ error: 'Акт не найден' }, { status: 404 })
    }

    await prisma.estimates.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ошибка удаления акта:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления акта' },
      { status: 500 }
    )
  }
} 