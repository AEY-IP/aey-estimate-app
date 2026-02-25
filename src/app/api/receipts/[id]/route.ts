import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkAuth } from '@/lib/auth'
import { deleteFile } from '@/lib/storage'

const prisma = new PrismaClient()

// DELETE - удалить отдельный чек
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Получаем чек с блоком и клиентом
    const receipt = await prisma.receipt.findUnique({
      where: { id: params.id },
      include: {
        block: {
          include: {
            client: true
          }
        }
      }
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Чек не найден' }, { status: 404 })
    }

    if (session.role === 'MANAGER' && receipt.block.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Удаляем файл из Yandex Cloud
    try {
      await deleteFile(receipt.filePath)
    } catch (error) {
      console.error(`Ошибка удаления файла ${receipt.filePath}:`, error)
      // Продолжаем даже если не удалось удалить файл
    }

    // Удаляем запись из БД
    await prisma.receipt.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting receipt:', error)
    return NextResponse.json({ error: 'Ошибка удаления чека' }, { status: 500 })
  }
} 