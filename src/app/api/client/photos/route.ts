import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database'
import { cookies } from 'next/headers'


export const dynamic = 'force-dynamic'
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

    console.log('✅ Found photo blocks:', photoBlocks.length);
    console.log('📊 Photo blocks data:', photoBlocks.map(block => ({
      id: block.id,
      title: block.title,
      photosCount: block.photos.length
    })));

    console.log('=== CLIENT PHOTOS API END (SUCCESS) ===');
    return NextResponse.json({ photoBlocks })
  } catch (error) {
    console.error('❌ Client photos API error:', error)
    console.log('=== CLIENT PHOTOS API END (ERROR) ===');
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
} 