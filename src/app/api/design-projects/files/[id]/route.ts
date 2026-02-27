import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkAuth } from '@/lib/auth'
import { deleteFile } from '@/lib/storage'


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient()

// DELETE - удаление файла дизайн-проекта
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const file = await (prisma as any).design_project_files.findUnique({
      where: { id: params.id },
      include: {
        design_project_blocks: {
          include: {
            clients: true
          }
        }
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 404 })
    }

    // Проверяем права доступа: только ADMIN и DESIGNER (привязанный к клиенту)
    if (session.role === 'DESIGNER' && file.design_project_blocks.clients.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role === 'MANAGER') {
      return NextResponse.json({ error: 'Менеджеры не могут удалять файлы из дизайн-проектов' }, { status: 403 })
    }

    // Удаляем файл из Yandex Cloud
    try {
      await deleteFile(file.filePath)
    } catch (error) {
      console.error(`Ошибка удаления файла ${file.filePath}:`, error)
      // Продолжаем даже если не удалось удалить файл
    }

    // Удаляем файл из БД
    await (prisma as any).design_project_files.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Файл успешно удален'
    })

  } catch (error) {
    console.error('Ошибка удаления файла дизайн-проекта:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

