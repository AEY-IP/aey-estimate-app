import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import { getSignedDownloadUrl } from '@/lib/storage'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'

async function toSignedUrl(filePath: string): Promise<string> {
  if (!filePath || filePath.startsWith('http')) {
    return filePath
  }

  try {
    const normalizedKey = filePath.replace(/^\/+/, '')
    return await getSignedDownloadUrl(normalizedKey, 3600)
  } catch (error) {
    console.error('Ошибка генерации signed URL для файла дизайн-проекта:', filePath, error)
    return filePath
  }
}
// GET - получить все блоки дизайн-проектов клиента
export async function GET(request: NextRequest) {
  try {
    // Проверяем обычную сессию (ADMIN/MANAGER/DESIGNER)
    let session = checkAuth(request)
    let isClientUser = false
    let clientUserId = null

    // Если нет обычной сессии, проверяем клиентскую
    if (!session) {
      const clientToken = request.cookies.get('client-token')?.value
      if (clientToken) {
        try {
          const decoded = jwt.verify(clientToken, process.env.JWT_SECRET!) as any
          if (decoded.type === 'client') {
            isClientUser = true
            clientUserId = decoded.clientId
            session = {
              id: decoded.clientId,
              role: 'CLIENT' as const,
              username: decoded.username
            }
          }
        } catch (error) {
          console.error('Client token verification failed:', error)
        }
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Не указан ID клиента' }, { status: 400 })
    }

    // Проверяем доступ к клиенту
    const client = await prisma.clients.findUnique({
      where: { id: clientId }
    })

    if (!client || !client.isActive) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    // DESIGNER может видеть только своих клиентов
    if (session.role === 'DESIGNER' && client.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // MANAGER может видеть только своих клиентов
    if (session.role === 'MANAGER' && client.managerId !== session.id && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // CLIENT может видеть только свои дизайн-проекты
    if (isClientUser && clientUserId !== clientId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Получаем блоки дизайн-проектов
    const designProjectBlocks = await prisma.design_project_blocks.findMany({
      where: {
        clientId: clientId,
        isVisible: true
      },
      include: {
        design_project_files: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Генерируем signed URLs для всех файлов
    const blocksWithSignedUrls = await Promise.all(
      designProjectBlocks.map(async (block: any) => {
        const filesWithUrls = await Promise.all(
          block.design_project_files.map(async (file: any) => {
            const filePath = await toSignedUrl(file.filePath)
            return { ...file, filePath };
          })
        );
        return { ...block, files: filesWithUrls };
      })
    );

    return NextResponse.json({ designProjectBlocks: blocksWithSignedUrls })
  } catch (error) {
    console.error('Error fetching design project blocks:', error)
    return NextResponse.json({ error: 'Ошибка загрузки блоков дизайн-проекта' }, { status: 500 })
  }
}

// POST - создать новый блок дизайн-проекта
export async function POST(request: NextRequest) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { clientId, title, description } = await request.json()

    if (!clientId || !title?.trim()) {
      return NextResponse.json({ 
        error: 'Не указан ID клиента или название блока' 
      }, { status: 400 })
    }

    // Проверяем доступ к клиенту
    const client = await prisma.clients.findUnique({
      where: { id: clientId }
    })

    if (!client || !client.isActive) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 })
    }

    // Только ADMIN и DESIGNER (привязанный к клиенту) могут создавать блоки
    if (session.role === 'DESIGNER' && client.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role === 'MANAGER') {
      return NextResponse.json({ error: 'Менеджеры не могут создавать блоки дизайн-проектов' }, { status: 403 })
    }

    // Получаем максимальный sortOrder
    const maxSortOrder = await prisma.design_project_blocks.findFirst({
      where: { clientId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    // Создаем блок дизайн-проекта
    const designProjectBlock = await prisma.design_project_blocks.create({
      data: {
        id: randomUUID(),
        title: title.trim(),
        description: description?.trim() || null,
        clientId: clientId,
        createdBy: session.id,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1,
        updatedAt: new Date()
      },
      include: {
        design_project_files: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json({
      ...designProjectBlock,
      files: designProjectBlock.design_project_files
    })
  } catch (error) {
    console.error('Error creating design project block:', error)
    return NextResponse.json({ error: 'Ошибка создания блока дизайн-проекта' }, { status: 500 })
  }
}

