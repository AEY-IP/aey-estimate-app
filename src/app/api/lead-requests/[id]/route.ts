import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkAuth } from '@/lib/auth'

const prisma = new PrismaClient()

// PATCH - обновить заявку (статус или заметки)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const { status, notes } = await request.json()

    // Проверяем существование заявки
    const existingLead = await prisma.leadRequest.findUnique({
      where: { id: params.id }
    })

    if (!existingLead) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    // Обновляем заявку
    const updatedLead = await prisma.leadRequest.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes })
      }
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error('Error updating lead request:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении заявки' },
      { status: 500 }
    )
  }
}

// DELETE - удалить заявку
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Проверяем существование заявки
    const existingLead = await prisma.leadRequest.findUnique({
      where: { id: params.id }
    })

    if (!existingLead) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    // Удаляем заявку
    await prisma.leadRequest.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead request:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении заявки' },
      { status: 500 }
    )
  }
}

