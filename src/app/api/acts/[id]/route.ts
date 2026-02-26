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

    const act = await prisma.estimate.findUnique({
      where: { 
        id: params.id,
        isAct: true
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        },
        exportCache: true,
        rooms: {
          include: {
            works: {
              include: {
                workItem: {
                  include: {
                    block: true
                  }
                }
              }
            },
            materials: true,
            roomParameterValues: {
              include: {
                parameter: true
              }
            }
          }
        },
        coefficients: true,
        roomParameterValues: {
          include: {
            parameter: true
          }
        }
      }
    })

    if (!act) {
      return NextResponse.json({ error: 'Акт не найден' }, { status: 404 })
    }

    return NextResponse.json(act)

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

    const act = await prisma.estimate.update({
      where: { 
        id: params.id,
        isAct: true
      },
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
        worksBlock: data.worksBlock
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(act)

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

    await prisma.estimate.delete({
      where: { 
        id: params.id,
        isAct: true
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ошибка удаления акта:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления акта' },
      { status: 500 }
    )
  }
} 