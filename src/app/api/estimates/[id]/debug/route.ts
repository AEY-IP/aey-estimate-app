import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'


export const dynamic = 'force-dynamic'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const estimateId = params.id

    console.log('=== ESTIMATE DEBUG START ===')
    console.log('Estimate ID:', estimateId)
    
    // Получаем смету с полными данными
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
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
            username: true
          }
        },
        rooms: {
          include: {
            works: {
              include: {
                workItem: true
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
        roomParameterValues: {
          include: {
            parameter: true
          }
        },
        coefficients: true
      }
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    // Собираем диагностическую информацию
    const diagnostics = {
      estimate: {
        id: estimate.id,
        title: estimate.title,
        type: estimate.type,
        category: estimate.category,
        roomsCount: estimate.rooms?.length || 0,
        hasWorksBlock: !!estimate.worksBlock,
        hasMaterialsBlock: !!estimate.materialsBlock,
        hasSummaryWorksBlock: !!estimate.summaryWorksBlock,
        hasSummaryMaterialsBlock: !!estimate.summaryMaterialsBlock,
        coefficientsDataLength: estimate.coefficientsData?.length || 0,
        coefficientSettingsLength: estimate.coefficientSettings?.length || 0,
        manualPricesLength: estimate.manualPrices?.length || 0
      },
      rooms: estimate.rooms?.map(room => ({
        id: room.id,
        name: room.name,
        worksCount: room.works?.length || 0,
        materialsCount: room.materials?.length || 0,
        parameterValuesCount: room.roomParameterValues?.length || 0,
        invalidWorkItems: room.works?.filter(work => work.workItemId && !work.workItem)?.length || 0,
        invalidParameters: room.roomParameterValues?.filter(param => !param.parameter)?.length || 0
      })) || [],
      globalParameterValues: estimate.roomParameterValues?.length || 0,
      invalidGlobalParameters: estimate.roomParameterValues?.filter(param => !param.parameter)?.length || 0,
      jsonFields: {
        worksBlockValid: estimate.worksBlock ? isValidJSON(estimate.worksBlock) : null,
        materialsBlockValid: estimate.materialsBlock ? isValidJSON(estimate.materialsBlock) : null,
        summaryWorksBlockValid: estimate.summaryWorksBlock ? isValidJSON(estimate.summaryWorksBlock) : null,
        summaryMaterialsBlockValid: estimate.summaryMaterialsBlock ? isValidJSON(estimate.summaryMaterialsBlock) : null,
        coefficientsDataValid: estimate.coefficientsData ? isValidJSON(estimate.coefficientsData) : null,
        coefficientSettingsValid: estimate.coefficientSettings ? isValidJSON(estimate.coefficientSettings) : null,
        manualPricesValid: estimate.manualPrices ? isValidJSON(estimate.manualPrices) : null
      },
      statistics: {
        totalWorksAcrossRooms: estimate.rooms?.reduce((sum, room) => sum + (room.works?.length || 0), 0) || 0,
        totalMaterialsAcrossRooms: estimate.rooms?.reduce((sum, room) => sum + (room.materials?.length || 0), 0) || 0,
        averageWorksPerRoom: estimate.rooms?.length ? 
          (estimate.rooms.reduce((sum, room) => sum + (room.works?.length || 0), 0) / estimate.rooms.length).toFixed(2) : 0
      }
    }

    console.log('Diagnostics generated:', JSON.stringify(diagnostics, null, 2))
    console.log('=== ESTIMATE DEBUG END ===')

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error('=== ESTIMATE DEBUG ERROR ===')
    console.error('Error details:', error)
    return NextResponse.json(
      { error: 'Ошибка диагностики', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
} 