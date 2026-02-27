import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'


export const dynamic = 'force-dynamic'
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const { blockIds, roomId, isSummaryView } = await request.json()

    if (!Array.isArray(blockIds)) {
      return NextResponse.json(
        { error: 'Некорректные данные' },
        { status: 400 }
      )
    }

    // Получаем смету
    const estimate = await prisma.estimates.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        rooms: true
      }
    })

    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    // Проверяем права доступа
    if (session.role === 'MANAGER') {
      const client = await prisma.clients.findUnique({
        where: { id: estimate.clientId }
      })
      if (!client || client.createdBy !== session.id) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    // Обновляем порядок блоков
    if (estimate.type === 'apartment') {
      // Для apartment - обновляем JSON в основной смете
      const currentWorksBlock = estimate.worksBlock ? JSON.parse(estimate.worksBlock as string) : { blocks: [] }
      
      // Создаем мапу блоков по ID
      const blocksMap = new Map()
      currentWorksBlock.blocks.forEach((block: any) => {
        blocksMap.set(block.id, block)
      })

      // Пересортируем блоки согласно новому порядку
      const reorderedBlocks = blockIds.map((blockId: string) => blocksMap.get(blockId)).filter(Boolean)

      // Обновляем смету
      await prisma.estimates.update({
        where: { id: params.id },
        data: {
          worksBlock: JSON.stringify({
            ...currentWorksBlock,
            blocks: reorderedBlocks
          })
        }
      })

    } else if (estimate.type === 'rooms' && isSummaryView) {
      // Для сводной сметы - обновляем summaryWorksBlock
      const currentSummaryWorksBlock = estimate.summaryWorksBlock ? JSON.parse(estimate.summaryWorksBlock as string) : { blocks: [] }
      
      // Создаем мапу блоков по ID
      const blocksMap = new Map()
      currentSummaryWorksBlock.blocks.forEach((block: any) => {
        blocksMap.set(block.id, block)
      })

      // Пересортируем блоки согласно новому порядку
      const reorderedBlocks = blockIds.map((blockId: string) => blocksMap.get(blockId)).filter(Boolean)

      // Обновляем смету
      await prisma.estimates.update({
        where: { id: params.id },
        data: {
          summaryWorksBlock: JSON.stringify({
            ...currentSummaryWorksBlock,
            blocks: reorderedBlocks
          })
        }
      })
      
    } else if (estimate.type === 'rooms' && roomId) {
      // Для rooms - обновляем JSON в конкретном помещении
      const room = await (prisma as any).room.findFirst({
        where: { 
          id: roomId,
          estimateId: params.id 
        }
      })

      if (!room) {
        return NextResponse.json(
          { error: 'Помещение не найдено' },
          { status: 404 }
        )
      }

      const currentWorksBlock = room.worksBlock ? JSON.parse(room.worksBlock as string) : { blocks: [] }
      
      // Создаем мапу блоков по ID
      const blocksMap = new Map()
      currentWorksBlock.blocks.forEach((block: any) => {
        blocksMap.set(block.id, block)
      })

      // Пересортируем блоки согласно новому порядку
      const reorderedBlocks = blockIds.map((blockId: string) => blocksMap.get(blockId)).filter(Boolean)

      // Обновляем помещение
      await (prisma as any).room.update({
        where: { id: roomId },
        data: {
          worksBlock: JSON.stringify({
            ...currentWorksBlock,
            blocks: reorderedBlocks
          })
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ошибка при изменении порядка блоков:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 