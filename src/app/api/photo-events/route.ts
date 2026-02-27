import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { checkAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic'
// GET - получить все события фотографий для клиента
export async function GET(request: NextRequest) {
  try {
    const user = await checkAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID обязателен' }, { status: 400 });
    }

    // Проверяем доступ к клиенту
    const client = await prisma.clients.findFirst({
      where: {
        id: clientId,
        ...(user.role !== 'ADMIN' ? { createdBy: user.id } : {})
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

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
    });

    return NextResponse.json({ photoBlocks });
  } catch (error) {
    console.error('Ошибка загрузки событий фотографий:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST - создать новое событие фотографий
export async function POST(request: NextRequest) {
  try {
    const user = await checkAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, title, description } = body;

    if (!clientId || !title) {
      return NextResponse.json({ 
        error: 'Client ID и название события обязательны' 
      }, { status: 400 });
    }

    // Проверяем доступ к клиенту
    const client = await prisma.clients.findFirst({
      where: {
        id: clientId,
        ...(user.role !== 'ADMIN' ? { createdBy: user.id } : {})
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    const photoBlock = await prisma.photo_blocks.create({
      data: {
        title,
        description,
        clientId
      },
      include: {
        photos: true
      }
    });

    return NextResponse.json({ photoBlock });
  } catch (error) {
    console.error('Ошибка создания события фотографий:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
} 