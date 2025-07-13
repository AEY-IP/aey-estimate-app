import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

// POST - получить готовые рассчитанные цены с фронтенда и сохранить в кеш
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { calculatedWorksData, calculatedMaterialsData, totals } = await request.json()

    // Сохраняем готовые рассчитанные данные в кеш
    const cache = await prisma.estimateExport.upsert({
      where: { estimateId: params.id },
      create: {
        estimateId: params.id,
        worksData: JSON.stringify(calculatedWorksData),
        materialsData: JSON.stringify(calculatedMaterialsData),
        totalWorksPrice: totals.totalWorksPrice,
        totalMaterialsPrice: totals.totalMaterialsPrice,
        grandTotal: totals.grandTotal,
        coefficientsInfo: JSON.stringify(totals.coefficientsInfo || null)
      },
      update: {
        worksData: JSON.stringify(calculatedWorksData),
        materialsData: JSON.stringify(calculatedMaterialsData),
        totalWorksPrice: totals.totalWorksPrice,
        totalMaterialsPrice: totals.totalMaterialsPrice,
        grandTotal: totals.grandTotal,
        coefficientsInfo: JSON.stringify(totals.coefficientsInfo || null),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Кеш экспорта создан/обновлен'
    })
  } catch (error) {
    console.error('Error saving calculated prices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 