import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database'
import { cookies } from 'next/headers'
import { getSignedDownloadUrl } from '@/lib/storage'


export const dynamic = 'force-dynamic'

async function toSignedUrl(filePath: string): Promise<string> {
  if (!filePath || filePath.startsWith('http')) {
    return filePath
  }

  try {
    const normalizedKey = filePath.replace(/^\/+/, '')
    return await getSignedDownloadUrl(normalizedKey, 3600)
  } catch (error) {
    console.error('Ошибка генерации signed URL для фото:', filePath, error)
    return filePath
  }
}
// GET - получить все события фотографий для текущего клиента
export async function GET(request: NextRequest) {
  console.log('=== CLIENT PHOTOS API START ===');
  try {
    const cookieStore = cookies()
    const clientToken = cookieStore.get('client-token')?.value

    console.log('🔑 Client token exists:', !!clientToken);

    if (!clientToken) {
      console.log('❌ No client token found');
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Декодируем токен клиента
    const decoded = jwt.verify(clientToken, process.env.JWT_SECRET!) as any
    const clientId = decoded.clientId

    console.log('🆔 Client ID from token:', clientId);

    if (!clientId) {
      console.log('❌ No clientId in token');
      return NextResponse.json(
        { error: 'Неверный токен' },
        { status: 401 }
      )
    }

    console.log('📸 Loading photo blocks for client:', clientId);

    // Получаем события фотографий для данного клиента
    const photoBlocks = await prisma.photo_blocks.findMany({
      where: {
        clientId
      },
      include: {
        photos: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // В клиентском кабинете нужно отдавать доступные URL, а не сырой ключ из S3.
    const photoBlocksWithSignedUrls = await Promise.all(
      photoBlocks.map(async (block) => {
        const photosWithUrls = await Promise.all(
          block.photos.map(async (photo) => {
            const filePath = await toSignedUrl(photo.filePath)
            return {
              ...photo,
              filePath
            }
          })
        )
        return {
          ...block,
          photos: photosWithUrls
        }
      })
    )

    console.log('✅ Found photo blocks:', photoBlocksWithSignedUrls.length)
    console.log('📊 Photo blocks data:', photoBlocksWithSignedUrls.map(block => ({
      id: block.id,
      title: block.title,
      photosCount: block.photos.length
    })))

    console.log('=== CLIENT PHOTOS API END (SUCCESS) ===');
    return NextResponse.json({ photoBlocks: photoBlocksWithSignedUrls })
  } catch (error) {
    console.error('❌ Client photos API error:', error)
    console.log('=== CLIENT PHOTOS API END (ERROR) ===');
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
} 