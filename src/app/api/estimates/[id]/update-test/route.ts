import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient()

// Проверка авторизации
async function checkAuth() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('auth-session')
  
  if (!sessionCookie) {
    return null
  }
  
  try {
    const decodedValue = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    const sessionData = JSON.parse(decodedValue)
    return sessionData
  } catch (error) {
    return null
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const session = await checkAuth()
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    console.log('=== TEST UPDATE API START ===')
    console.log('Estimate ID:', params.id)
    
    const body = await request.json()
    console.log('Original body keys:', Object.keys(body))
    
    // Создаем объект только с разрешенными полями
    const updateData: any = {
      updatedAt: new Date()
    }
    
    // Вручную добавляем только те поля, которые точно есть в схеме
    if (body.title !== undefined) updateData.title = body.title
    if (body.type !== undefined) updateData.type = body.type
    if (body.category !== undefined) updateData.category = body.category
    if (body.totalWorksPrice !== undefined) updateData.totalWorksPrice = body.totalWorksPrice
    if (body.totalMaterialsPrice !== undefined) updateData.totalMaterialsPrice = body.totalMaterialsPrice
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice

    if (body.notes !== undefined) updateData.notes = body.notes
    
    console.log('TEST: Filtered update data:', updateData)
    console.log('TEST: Filtered keys:', Object.keys(updateData))
    
    // Обновляем смету
    const updatedEstimate = await prisma.estimate.update({
      where: { id: params.id },
      data: updateData,
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
        rooms: true,
        coefficients: true
      }
    })
    
    console.log('TEST: Estimate updated successfully')
    console.log('=== TEST UPDATE API END ===')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Тестовое обновление сработало!',
      estimate: updatedEstimate 
    })
  } catch (error) {
    console.error('=== TEST UPDATE API ERROR ===')
    console.error('Test error details:', error)
    console.error('Test error message:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Ошибка тестового обновления', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
} 