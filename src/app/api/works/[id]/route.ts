import { NextRequest, NextResponse } from 'next/server'
import { updateWork, deleteWork } from '@/lib/data-manager'

// PUT /api/works/[id] - обновление работы
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    
    const updatedWork = await updateWork(id, body)
    
    if (!updatedWork) {
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 })
    }
    
    return NextResponse.json({ work: updatedWork })
  } catch (error) {
    console.error('Ошибка обновления работы:', error)
    return NextResponse.json({ error: 'Ошибка обновления работы' }, { status: 500 })
  }
}

// PATCH /api/works/[id] - частичное обновление работы (например, статус)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    
    const updatedWork = await updateWork(id, body)
    
    if (!updatedWork) {
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 })
    }
    
    return NextResponse.json({ work: updatedWork })
  } catch (error) {
    console.error('Ошибка обновления работы:', error)
    return NextResponse.json({ error: 'Ошибка обновления работы' }, { status: 500 })
  }
}

// DELETE /api/works/[id] - удаление работы
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    const deleted = await deleteWork(id)
    
    if (!deleted) {
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления работы:', error)
    return NextResponse.json({ error: 'Ошибка удаления работы' }, { status: 500 })
  }
} 