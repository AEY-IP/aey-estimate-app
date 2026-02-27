import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/storage'
import { PrismaClient } from '@prisma/client'
import { checkAuth } from '@/lib/auth'


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const blockId = params.id

    // Получаем блок дизайн-проекта
    const designProjectBlock = await (prisma as any).design_project_blocks.findUnique({
      where: { id: blockId },
      include: { clients: true }
    })

    if (!designProjectBlock) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    // Проверяем права доступа: только ADMIN и DESIGNER (привязанный к клиенту)
    if (session.role === 'DESIGNER' && designProjectBlock.clients.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role === 'MANAGER') {
      return NextResponse.json({ error: 'Менеджеры не могут загружать файлы в дизайн-проекты' }, { status: 403 })
    }

    // Получаем данные формы
    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 })
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const key = `design-projects/${designProjectBlock.clientId}/${fileName}`

    // Загружаем файл в Yandex Cloud
    const buffer = Buffer.from(await file.arrayBuffer())
    await uploadFile(buffer, key, file.type, false)

    // Получаем максимальный sortOrder
    const maxSortOrder = await (prisma as any).design_project_files.findFirst({
      where: { blockId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    // Сохраняем информацию о файле в БД
    const designProjectFile = await (prisma as any).design_project_files.create({
      data: {
        blockId: blockId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath: key,
        description: description || null,
        uploadedBy: session.id,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      file: {
        id: designProjectFile.id,
        fileName: designProjectFile.fileName,
        fileSize: designProjectFile.fileSize,
        mimeType: designProjectFile.mimeType,
        filePath: designProjectFile.filePath,
        description: designProjectFile.description,
        sortOrder: designProjectFile.sortOrder,
        createdAt: designProjectFile.createdAt
      }
    })

  } catch (error) {
    console.error('Ошибка загрузки файла дизайн-проекта:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

