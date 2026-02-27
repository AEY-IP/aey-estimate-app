import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'
import { uploadFile, getSignedDownloadUrl } from '@/lib/storage'
import sharp from 'sharp'
import { randomUUID } from 'crypto'


export const dynamic = 'force-dynamic'
async function checkEstimateAccess(estimateId: string, sessionId: string, role: string) {
  const estimate = await prisma.designer_estimates.findUnique({
    where: { id: estimateId }
  })

  if (!estimate || !estimate.isActive) {
    return { error: 'Смета не найдена', status: 404 }
  }

  if (role === 'DESIGNER' && estimate.designerId !== sessionId) {
    return { error: 'Доступ запрещен', status: 403 }
  }

  if (role !== 'ADMIN' && role !== 'DESIGNER') {
    return { error: 'Недостаточно прав', status: 403 }
  }

  return { estimate }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const accessCheck = await checkEstimateAccess(params.id, session.id, session.role)
    if (accessCheck.error) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { searchParams } = new URL(request.url)
    const blockId = searchParams.get('blockId')

    const where: any = {
      designer_estimate_blocks: {
        estimateId: params.id,
        isActive: true
      }
    }

    if (blockId) {
      where.blockId = blockId
    }

    const items = await prisma.designer_estimate_items.findMany({
      where,
      include: {
        designer_estimate_blocks: true
      },
      orderBy: { sortOrder: 'asc' }
    })

    const itemsWithSignedUrls = await Promise.all(
      items.map(async (item) => {
        if (item.imageUrl && !item.imageUrl.startsWith('http')) {
          const signedUrl = await getSignedDownloadUrl(item.imageUrl, 3600)
          return { ...item, imageUrl: signedUrl }
        }
        return item
      })
    )

    return NextResponse.json({
      items: itemsWithSignedUrls.map((item) => ({
        ...item,
        block: item.designer_estimate_blocks
      }))
    })
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const accessCheck = await checkEstimateAccess(params.id, session.id, session.role)
    if (accessCheck.error) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const manufacturer = formData.get('manufacturer') as string
    const link = formData.get('link') as string
    const unit = formData.get('unit') as string
    const pricePerUnit = parseFloat(formData.get('pricePerUnit') as string) || 0
    const quantity = parseFloat(formData.get('quantity') as string) || 1
    const blockId = formData.get('blockId') as string
    const notes = formData.get('notes') as string
    const imageFile = formData.get('image') as File | null

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название позиции обязательно' }, { status: 400 })
    }

    if (!blockId) {
      return NextResponse.json({ error: 'Не указан блок' }, { status: 400 })
    }

    if (!unit || !unit.trim()) {
      return NextResponse.json({ error: 'Единица измерения обязательна' }, { status: 400 })
    }

    const block = await prisma.designer_estimate_blocks.findUnique({
      where: { id: blockId }
    })

    if (!block || !block.isActive || block.estimateId !== params.id) {
      return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
    }

    let imageUrl: string | null = null

    if (imageFile && imageFile.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json({ 
          error: 'Поддерживаются только изображения (JPG, PNG, WebP, GIF)' 
        }, { status: 400 })
      }

      const maxSize = 10 * 1024 * 1024
      if (imageFile.size > maxSize) {
        return NextResponse.json({
          error: 'Размер изображения не должен превышать 10 МБ'
        }, { status: 400 })
      }

      const buffer = Buffer.from(await imageFile.arrayBuffer())
      
      const resizedBuffer = await sharp(buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toBuffer()

      const fileExtension = 'jpg'
      const key = `designer-estimates/${params.id}/${blockId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`

      await uploadFile(resizedBuffer, key, 'image/jpeg', false)

      imageUrl = key
    }

    const maxSortOrder = await prisma.designer_estimate_items.findFirst({
      where: { blockId, },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const totalPrice = pricePerUnit * quantity

    const item = await prisma.designer_estimate_items.create({
      data: {
        id: randomUUID(),
        name: name.trim(),
        manufacturer: manufacturer?.trim() || null,
        link: link?.trim() || null,
        imageUrl,
        unit: unit.trim(),
        pricePerUnit,
        quantity,
        totalPrice,
        blockId,
        notes: notes?.trim() || null,
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
        updatedAt: new Date()
      },
      include: {
        designer_estimate_blocks: true
      }
    })

    // Генерируем signed URL для изображения
    const itemWithSignedUrl = { ...item };
    if (itemWithSignedUrl.imageUrl && !itemWithSignedUrl.imageUrl.startsWith('http')) {
      console.log('🔑 Генерируем signed URL для:', itemWithSignedUrl.imageUrl);
      const signedUrl = await getSignedDownloadUrl(itemWithSignedUrl.imageUrl, 3600);
      console.log('✅ Signed URL:', signedUrl);
      itemWithSignedUrl.imageUrl = signedUrl;
    }

    console.log('📤 Возвращаем item с imageUrl:', itemWithSignedUrl.imageUrl);
    return NextResponse.json({
      item: {
        ...itemWithSignedUrl,
        block: itemWithSignedUrl.designer_estimate_blocks
      }
    })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json({ error: 'Ошибка создания позиции' }, { status: 500 })
  }
}
