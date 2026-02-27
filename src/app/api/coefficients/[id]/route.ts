import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Обновляем коэффициент
    const updatedCoefficient = await prisma.coefficients.update({
      where: { id: params.id },
      data: {
        ...body
      }
    })
    
    return NextResponse.json({ coefficient: updatedCoefficient })
  } catch (error) {
    console.error('Ошибка обновления коэффициента:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления коэффициента' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Удаляем коэффициент
    await prisma.coefficients.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления коэффициента:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления коэффициента' },
      { status: 500 }
    )
  }
} 