import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth, canAccessMainSystem } from '@/lib/auth'


export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к актам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    let whereCondition: any = {
      isAct: true
    }
    
    if (clientId) {
      whereCondition.clientId = clientId
      
      // Для менеджеров проверяем права доступа к клиенту
      if (session.role === 'MANAGER') {
        const client = await prisma.client.findUnique({
          where: { id: clientId, isActive: true }
        })
        
        if (!client || client.createdBy !== session.id) {
          return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
        }
      }
    } else if (session.role === 'MANAGER') {
      // Для менеджеров показываем только акты их клиентов
      const managerClients = await prisma.client.findMany({
        where: {
          createdBy: session.id,
          isActive: true
        },
        select: { id: true }
      })
      
      whereCondition.clientId = {
        in: managerClients.map(client => client.id)
      }
    }

    const acts = await prisma.estimate.findMany({
      where: whereCondition,
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
            materials: true
          }
        },
        coefficients: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ acts })

  } catch (error) {
    console.error('Ошибка получения актов:', error)
    return NextResponse.json(
      { error: 'Ошибка получения актов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== ACT CREATION API START ===')
    const session = checkAuth(request)
    console.log('Session:', session)
    
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    
    // Внешние дизайнеры не имеют доступа к актам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Request body:', body)
    const { estimateId } = body

    if (!estimateId) {
      console.log('No estimateId provided')
      return NextResponse.json(
        { error: 'ID сметы обязателен' },
        { status: 400 }
      )
    }

    console.log('Looking for estimate with ID:', estimateId)
    
    // Получаем смету для копирования
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        rooms: {
          include: {
            works: true,
            materials: true,
            roomParameterValues: true
          }
        },
        coefficients: true,
        roomParameterValues: true
      }
    })

    console.log('Found estimate:', estimate ? 'YES' : 'NO')
    if (estimate) {
      console.log('Estimate details:', {
        id: estimate.id,
        title: estimate.title,
        clientId: estimate.clientId,
        roomsCount: estimate.rooms?.length || 0
      })
    }

    if (!estimate) {
      console.log('Estimate not found in database')
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    console.log('Creating act (copy of estimate) based on estimate...')
    
    // Создаем акт как копию сметы в таблице estimates
    const act = await prisma.estimate.create({
      data: {
        title: `Акт - ${estimate.title}`,
        type: estimate.type,
        category: estimate.category,
        totalWorksPrice: estimate.totalWorksPrice,
        totalMaterialsPrice: estimate.totalMaterialsPrice,
        totalPrice: estimate.totalPrice,
        notes: estimate.notes,
        clientId: estimate.clientId,
        createdBy: session.id,
        coefficientSettings: estimate.coefficientSettings,
        coefficientsData: estimate.coefficientsData,
        manualPrices: estimate.manualPrices,
        materialsBlock: estimate.materialsBlock,
        summaryMaterialsBlock: estimate.summaryMaterialsBlock,
        summaryWorksBlock: estimate.summaryWorksBlock,
        worksBlock: estimate.worksBlock,
        showToClient: false, // По умолчанию скрыт от клиента
        isAct: true,
        
        // Копируем комнаты для смет по помещениям
        ...(estimate.type === 'rooms' && estimate.rooms.length > 0 ? {
          rooms: {
            create: estimate.rooms.map(room => ({
              name: room.name,
              totalWorksPrice: room.totalWorksPrice,
              totalMaterialsPrice: room.totalMaterialsPrice,
              totalPrice: room.totalPrice,
              
              // Копируем работы
              works: {
                create: room.works.map((work: any) => ({
                  quantity: work.quantity,
                  price: work.price,
                  totalPrice: work.totalPrice,
                  description: work.description,
                  workItemId: work.workItemId,
                  blockTitle: work.blockTitle,
                  manualWorkName: work.manualWorkName,
                  manualWorkUnit: work.manualWorkUnit
                }))
              },
              
              // Копируем материалы
              materials: {
                create: room.materials.map(material => ({
                  name: material.name,
                  unit: material.unit,
                  quantity: material.quantity,
                  price: material.price,
                  totalPrice: material.totalPrice,
                  description: material.description
                }))
              }
            }))
          }
        } : {}),
        
        // Копируем коэффициенты
        coefficients: {
          create: estimate.coefficients.map(coeff => ({
            name: coeff.name,
            value: coeff.value,
            description: coeff.description
          }))
        }
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

    console.log('Act (estimate copy) created successfully:', act.id)

    // Копируем параметры комнат на уровне сметы (акта)
    if (estimate.roomParameterValues.length > 0) {
      console.log('Copying room parameter values...')
      await prisma.estimateRoomParameterValue.createMany({
        data: estimate.roomParameterValues.map(param => ({
          parameterId: param.parameterId,
          value: param.value,
          estimateId: act.id
        }))
      })
    }

    // Обновляем кеш экспорта для акта (копируем из исходной сметы)
    console.log('Updating export cache for the new act...')
    const originalCache = await prisma.estimateExport.findUnique({
      where: { estimateId: estimateId }
    })
    
    if (originalCache) {
      await prisma.estimateExport.create({
        data: {
          estimateId: act.id,
          worksData: originalCache.worksData,
          materialsData: originalCache.materialsData,
          totalWorksPrice: originalCache.totalWorksPrice,
          totalMaterialsPrice: originalCache.totalMaterialsPrice,
          grandTotal: originalCache.grandTotal,
          coefficientsInfo: originalCache.coefficientsInfo
        }
      })
      console.log('Export cache copied to estimateExport for the act')
    } else {
      console.log('No export cache found for original estimate')
    }

    console.log('=== ACT CREATION API SUCCESS ===')
    return NextResponse.json({ act })

  } catch (error) {
    console.error('Ошибка создания акта:', error)
    return NextResponse.json(
      { error: 'Ошибка создания акта' },
      { status: 500 }
    )
  }
} 