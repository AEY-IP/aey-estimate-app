import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'


export const dynamic = 'force-dynamic'
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== SIMPLE ESTIMATE UPDATE START ===')
    
    // Проверяем авторизацию
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Request received for estimate:', params.id)
    console.log('Update fields:', Object.keys(body))
    
    // Проверяем что смета существует
    const existingEstimate = await prisma.estimates.findUnique({
      where: { id: params.id }
    })
    
    if (!existingEstimate) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }
    
    // Простое обновление основных полей
    const updateData: any = { updatedAt: new Date() }
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.type !== undefined) updateData.type = body.type
    if (body.category !== undefined) updateData.category = body.category
    if (body.totalWorksPrice !== undefined) updateData.totalWorksPrice = body.totalWorksPrice
    if (body.totalMaterialsPrice !== undefined) updateData.totalMaterialsPrice = body.totalMaterialsPrice
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice
    if (body.notes !== undefined) updateData.notes = body.notes
    
    // JSON поля
    if (body.coefficients !== undefined) {
      updateData.coefficientsData = JSON.stringify(body.coefficients)
    }
    if (body.coefficientSettings !== undefined) {
      updateData.coefficientSettings = JSON.stringify(body.coefficientSettings)
    }
    if (body.manualPrices !== undefined) {
      updateData.manualPrices = JSON.stringify(body.manualPrices)
    }
    if (body.worksBlock !== undefined) {
      updateData.worksBlock = JSON.stringify(body.worksBlock)
    }
    if (body.materialsBlock !== undefined) {
      updateData.materialsBlock = JSON.stringify(body.materialsBlock)
    }
    if (body.summaryWorksBlock !== undefined) {
      updateData.summaryWorksBlock = JSON.stringify(body.summaryWorksBlock)
    }
    if (body.summaryMaterialsBlock !== undefined) {
      updateData.summaryMaterialsBlock = JSON.stringify(body.summaryMaterialsBlock)
    }
    
    console.log('Updating estimate...')
    
    // Обновляем смету
    await prisma.estimates.update({
      where: { id: params.id },
      data: updateData
    })
    
    // Получаем обновленную смету
    const result = await prisma.estimates.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { id: true, name: true } },
        creator: { select: { id: true, username: true } },
        rooms: {
          include: {
            works: { include: { workItem: true } },
            materials: true,
            roomParameterValues: { include: { parameter: true } }
          }
        },
        roomParameterValues: { include: { parameter: true } },
        coefficients: true
      }
    })
    
    if (!result) {
      throw new Error('Failed to fetch updated estimate')
    }
    
    // Форматируем для фронтенда
    const formattedEstimate = {
      ...result,
      coefficients: result.coefficientsData ? JSON.parse(result.coefficientsData) : [],
      coefficientSettings: result.coefficientSettings ? JSON.parse(result.coefficientSettings) : {},
      manualPrices: result.manualPrices ? JSON.parse(result.manualPrices) : [],
      worksBlock: result.worksBlock ? JSON.parse(result.worksBlock) : null,
      materialsBlock: result.materialsBlock ? JSON.parse(result.materialsBlock) : null,
      summaryWorksBlock: result.summaryWorksBlock ? JSON.parse(result.summaryWorksBlock) : null,
      summaryMaterialsBlock: result.summaryMaterialsBlock ? JSON.parse(result.summaryMaterialsBlock) : null
    }
    
    console.log('✅ Estimate updated successfully')
    return NextResponse.json(formattedEstimate)
    
  } catch (error) {
    console.error('❌ Simple estimate update error:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления сметы', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 