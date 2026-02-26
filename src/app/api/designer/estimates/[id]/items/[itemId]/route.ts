import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'
import { uploadFile, deleteFile, getSignedDownloadUrl } from '@/lib/storage'
import sharp from 'sharp'


export const dynamic = 'force-dynamic'
async function checkItemAccess(itemId: string, sessionId: string, role: string) {
  const item = await prisma.designerEstimateItem.findUnique({
    where: { id: itemId },
    include: {
      block: {
        include: {
          estimate: true
        }
      }
    }
  })

  if (!item) {
    return { error: 'Позиция не найдена', status: 404 }
  }

  if (role === 'DESIGNER' && item.block.estimate.designerId !== sessionId) {
    return { error: 'Доступ запрещен', status: 403 }
  }

  if (role !== 'ADMIN' && role !== 'DESIGNER') {
    return { error: 'Недостаточно прав', status: 403 }
  }

  return { item }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, itemId: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const accessCheck = await checkItemAccess(params.itemId, session.id, session.role)
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
    const notes = formData.get('notes') as string
    const imageFile = formData.get('image') as File | null
    const removeImage = formData.get('removeImage') === 'true'

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название позиции обязательно' }, { status: 400 })
    }

    if (!unit || !unit.trim()) {
      return NextResponse.json({ error: 'Единица измерения обязательна' }, { status: 400 })
    }

    let imageUrl = accessCheck.item!.imageUrl

    if (removeImage && imageUrl) {
      try {
        await deleteFile(imageUrl)
      } catch (error) {
        console.error('Error deleting old image:', error)
      }
      imageUrl = null
    }

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

      if (imageUrl) {
        try {
          await deleteFile(imageUrl)
        } catch (error) {
          console.error('Error deleting old image:', error)
        }
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
      const key = `designer-estimates/${params.id}/${accessCheck.item!.blockId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`

      await uploadFile(resizedBuffer, key, 'image/jpeg', false)

      imageUrl = key
    }

    const totalPrice = pricePerUnit * quantity

    const item = await prisma.designerEstimateItem.update({
      where: { id: params.itemId },
      data: {
        name: name.trim(),
        manufacturer: manufacturer?.trim() || null,
        link: link?.trim() || null,
        imageUrl,
        unit: unit.trim(),
        pricePerUnit,
        quantity,
        totalPrice,
        notes: notes?.trim() || null
      },
      include: {
        block: true
      }
    })

    // Генерируем signed URL для изображения
    const itemWithSignedUrl = { ...item };
    if (itemWithSignedUrl.imageUrl && !itemWithSignedUrl.imageUrl.startsWith('http')) {
      itemWithSignedUrl.imageUrl = await getSignedDownloadUrl(itemWithSignedUrl.imageUrl, 3600);
    }

    return NextResponse.json({ item: itemWithSignedUrl })
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Ошибка обновления позиции' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string, itemId: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const accessCheck = await checkItemAccess(params.itemId, session.id, session.role)
    if (accessCheck.error) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const body = await request.json()
    const { sortOrder, blockId } = body

    const updateData: any = {}
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (blockId !== undefined) {
      const newBlock = await prisma.designerEstimateBlock.findUnique({
        where: { id: blockId }
      })
      if (!newBlock || newBlock.estimateId !== params.id) {
        return NextResponse.json({ error: 'Блок не найден' }, { status: 404 })
      }
      updateData.blockId = blockId
    }

    const item = await prisma.designerEstimateItem.update({
      where: { id: params.itemId },
      data: updateData
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating item sort order:', error)
    return NextResponse.json({ error: 'Ошибка обновления порядка позиции' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, itemId: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const accessCheck = await checkItemAccess(params.itemId, session.id, session.role)
    if (accessCheck.error) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    if (accessCheck.item!.imageUrl) {
      try {
        await deleteFile(accessCheck.item!.imageUrl)
      } catch (error) {
        console.error('Error deleting image:', error)
      }
    }

    await prisma.designerEstimateItem.delete({
      where: { id: params.itemId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Ошибка удаления позиции' }, { status: 500 })
  }
}
