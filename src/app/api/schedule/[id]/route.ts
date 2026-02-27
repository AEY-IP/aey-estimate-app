import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { id } = params
    const updates = await request.json()

    const project = await prisma.schedule_projects.update({
      where: { id },
      data: updates,
      include: {
        tasks: {
          orderBy: [
            { level: 'asc' },
            { orderIndex: 'asc' }
          ]
        }
      }
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Ошибка обновления проекта:', error)
    return NextResponse.json({ error: 'Ошибка обновления проекта' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const { id } = params

    // Сначала удаляем все задачи
    await prisma.schedule_tasks.deleteMany({
      where: { projectId: id }
    })

    // Затем удаляем проект
    await prisma.schedule_projects.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка удаления проекта:', error)
    return NextResponse.json({ error: 'Ошибка удаления проекта' }, { status: 500 })
  }
} 