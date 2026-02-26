import { NextRequest, NextResponse } from 'next/server'
import { checkAuth, checkClientAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'

export const dynamic = 'force-dynamic'
// import { getServerSession } from 'next-auth'

// GET - получить кеш экспорта (временная заглушка)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию - либо админ/менеджер, либо клиент
    const session = checkAuth(request)
    const clientSession = checkClientAuth(request)
    
    if (!session && !clientSession) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const estimateId = params.id

    // Получаем смету для проверки прав доступа
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        client: true
      }
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    // Проверяем права доступа
    if (session) {
      // Авторизация как админ/менеджер
      if (session.role === 'MANAGER' && estimate.client.createdBy !== session.id) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
      }
    } else if (clientSession) {
      // Авторизация как клиент
      if (estimate.clientId !== clientSession.clientId) {
        return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
      }
      
      // Проверяем, что смета видна клиенту
      if (!estimate.showToClient) {
        return NextResponse.json({ error: 'Смета скрыта от клиента' }, { status: 403 })
      }
    }

    // Читаем кеш экспорта из таблицы EstimateExport
    const exportCache = await prisma.estimateExport.findUnique({
      where: { estimateId }
    })

    if (!exportCache) {
      return NextResponse.json({ error: 'Кеш экспорта не найден. Обратитесь к администратору для пересчета сметы.' }, { status: 404 })
    }

    // Парсим данные из кеша
    const worksData = JSON.parse(exportCache.worksData)
    const materialsData = JSON.parse(exportCache.materialsData)
    const totalWorksPrice = exportCache.totalWorksPrice
    const totalMaterialsPrice = exportCache.totalMaterialsPrice

    // Преобразуем поля для совместимости с клиентским интерфейсом
    const transformedWorksData = worksData.map((block: any) => ({
      ...block,
      items: block.items.map((item: any) => ({
        ...item,
        displayUnitPrice: item.unitPrice,
        displayTotalPrice: item.totalPrice
      }))
    }))

    const transformedMaterialsData = materialsData.map((item: any) => ({
      ...item,
      displayUnitPrice: item.unitPrice,
      displayTotalPrice: item.totalPrice
    }))

    // Получаем коэффициенты для отображения (если нужно)
    const coefficientsInfo = exportCache.coefficientsInfo ? 
      JSON.parse(exportCache.coefficientsInfo) : 
      {
        normal: 1,
        final: 1, 
        global: 1,
        applied: []
      }

    // Возвращаем данные в том же формате, что ожидает клиент
    return NextResponse.json({
      worksData: transformedWorksData,
      materialsData: transformedMaterialsData,
      totalWorksPrice,
      totalMaterialsPrice,
      grandTotal: exportCache.grandTotal,
      coefficientsInfo,
      estimate: {
        id: estimate.id,
        title: estimate.title,
        createdAt: estimate.createdAt,
        updatedAt: estimate.updatedAt
      }
    })

  } catch (error) {
    console.error('Ошибка получения кеша экспорта:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// POST для создания/обновления кеша экспорта
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const estimateId = params.id
    let body
    
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('Ошибка парсинга JSON:', jsonError)
      return NextResponse.json({ error: 'Некорректный JSON в теле запроса' }, { status: 400 })
    }

    // Проверяем наличие обязательных полей
    if (!body.worksData || !body.materialsData || 
        typeof body.totalWorksPrice !== 'number' || 
        typeof body.totalMaterialsPrice !== 'number' || 
        typeof body.grandTotal !== 'number') {
      console.error('Отсутствуют обязательные поля в теле запроса:', body)
      return NextResponse.json({ error: 'Отсутствуют обязательные поля в теле запроса' }, { status: 400 })
    }

    // Получаем смету для проверки прав доступа
    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        client: true
      }
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    // Проверяем права доступа для менеджеров
    if (session.role === 'MANAGER' && estimate.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Создаем или обновляем кеш экспорта
    const exportCacheData = {
      worksData: JSON.stringify(body.worksData),
      materialsData: JSON.stringify(body.materialsData),
      totalWorksPrice: body.totalWorksPrice,
      totalMaterialsPrice: body.totalMaterialsPrice,
      grandTotal: body.grandTotal,
      coefficientsInfo: JSON.stringify(body.coefficientsInfo || null)
    }

    const exportCache = await prisma.estimateExport.upsert({
      where: { estimateId },
      update: exportCacheData,
      create: {
        estimateId,
        ...exportCacheData
      }
    })

    console.log('Export cache created/updated for estimate:', estimateId)

    return NextResponse.json({ 
      success: true, 
      message: 'Кеш экспорта создан/обновлен',
      exportCache
    })

  } catch (error) {
    console.error('Ошибка создания кеша экспорта:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// Серверная версия расчета цен
function calculateEstimatePricesServer(estimate: any, coefficients: any[]) {
  // Логика расчета цен с коэффициентами
  const estimateData = JSON.parse(estimate.summaryWorksBlock || estimate.worksBlock || '{"blocks":[]}')
  const materialsData = JSON.parse(estimate.summaryMaterialsBlock || estimate.materialsBlock || '{"items":[]}')
  const manualPrices = new Set(JSON.parse(estimate.manualPrices || '[]'))
  
  // Рассчитываем коэффициенты
  const normalCoeff = coefficients.reduce((acc: number, coeff: any) => {
    if (!coeff.type || coeff.type === 'normal') {
      return acc * coeff.value
    }
    return acc
  }, 1)
  
  const finalCoeff = coefficients.reduce((acc: number, coeff: any) => {
    if (coeff.type === 'final') {
      return acc * coeff.value
    }
    return acc
  }, 1)

  // Рассчитываем работы
  const worksData = estimateData.blocks.map((block: any) => ({
    ...block,
    items: block.items.map((item: any) => {
      let adjustedUnitPrice: number
      let adjustedTotalPrice: number
      
      if (manualPrices.has(item.id)) {
        adjustedUnitPrice = item.unitPrice * finalCoeff
        adjustedTotalPrice = adjustedUnitPrice * item.quantity
      } else {
        adjustedUnitPrice = item.unitPrice * normalCoeff * finalCoeff
        adjustedTotalPrice = adjustedUnitPrice * item.quantity
      }
      
      return {
        ...item,
        displayUnitPrice: Math.round(adjustedUnitPrice),
        displayTotalPrice: Math.round(adjustedTotalPrice)
      }
    })
  }))

  const totalWorksPrice = worksData.reduce((sum: number, block: any) => 
    sum + block.items.reduce((blockSum: number, item: any) => blockSum + item.displayTotalPrice, 0), 0
  )

  // Рассчитываем материалы
  const globalCoeff = normalCoeff * finalCoeff
  const materialsDataProcessed = materialsData.items.map((item: any) => ({
    ...item,
    displayUnitPrice: Math.round(item.unitPrice * globalCoeff),
    displayTotalPrice: Math.round(item.unitPrice * globalCoeff * item.quantity)
  }))

  const totalMaterialsPrice = materialsDataProcessed.reduce((sum: number, item: any) => sum + item.displayTotalPrice, 0)

  return {
    worksData,
    materialsData: materialsDataProcessed,
    totalWorksPrice,
    totalMaterialsPrice,
    grandTotal: totalWorksPrice + totalMaterialsPrice,
    coefficientsInfo: {
      normal: normalCoeff,
      final: finalCoeff,
      global: globalCoeff,
      applied: coefficients
    }
  }
} 