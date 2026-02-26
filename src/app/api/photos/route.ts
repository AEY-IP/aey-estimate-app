import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkAuth, checkClientAuth } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/storage';


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Сначала пробуем cookie-авторизацию для админов
    const session = checkAuth(request);
    // Затем пробуем клиентскую авторизацию через cookie
    const clientSession = checkClientAuth(request);
    
    let userId: string;
    let userType: 'admin' | 'client' = 'admin';
    let targetClientId: string | null = null;

    if (session) {
      // Cookie-авторизация админа успешна
      userId = session.id;
      userType = 'admin';
    } else if (clientSession) {
      // Cookie-авторизация клиента успешна
      userId = clientSession.clientUserId;
      userType = 'client';
      targetClientId = clientSession.clientId;
    } else {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем clientId из параметров
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'ID клиента не предоставлен' }, { status: 400 });
    }

    // Для клиентов проверяем, что они запрашивают свои фотографии
    if (userType === 'client' && targetClientId && clientId !== targetClientId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Проверяем доступ к клиенту
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        isActive: true,
        ...(userType === 'client' && targetClientId ? { id: targetClientId } : {})
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    // Для менеджеров проверяем права доступа
    if (session && session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Получаем блоки фотографий с фотографиями
    const photoBlocks = await prisma.photoBlock.findMany({
      where: {
        clientId: clientId
      },
      include: {
        photos: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Генерируем signed URLs для всех фотографий
    const photoBlocksWithSignedUrls = await Promise.all(
      photoBlocks.map(async (block: any) => {
        const photosWithUrls = await Promise.all(
          block.photos.map(async (photo: any) => {
            let filePath = photo.filePath;
            // Если это ключ (не начинается с http), генерируем signed URL
            if (filePath && !filePath.startsWith('http')) {
              filePath = await getSignedDownloadUrl(filePath, 3600);
            }
            return {
              id: photo.id,
              fileName: photo.fileName,
              filePath,
              fileSize: photo.fileSize,
              mimeType: photo.mimeType,
              description: photo.description,
              createdAt: photo.createdAt
            };
          })
        );
        return {
          id: block.id,
          title: block.title,
          description: block.description,
          createdAt: block.createdAt,
          updatedAt: block.updatedAt,
          photos: photosWithUrls
        };
      })
    );

    return NextResponse.json({
      success: true,
      photoBlocks: photoBlocksWithSignedUrls
    });

  } catch (error) {
    console.error('Ошибка получения фотографий:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Создание нового блока фотографий
    const session = checkAuth(request);
    const clientSession = checkClientAuth(request);
    
    if (!session && !clientSession) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Блокируем создание блоков для клиентов
    if (clientSession && !session) {
      return NextResponse.json({ error: 'Клиенты не могут создавать блоки фотографий' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, title, description } = body;

    if (!clientId || !title) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 });
    }

    // Проверяем доступ к клиенту
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        isActive: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    // Для менеджеров проверяем права доступа
    if (session && session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Создаем блок фотографий
    const photoBlock = await prisma.photoBlock.create({
      data: {
        clientId,
        title,
        description: description || ''
      }
    });

    return NextResponse.json({
      success: true,
      photoBlock: {
        id: photoBlock.id,
        title: photoBlock.title,
        description: photoBlock.description,
        createdAt: photoBlock.createdAt,
        updatedAt: photoBlock.updatedAt,
        photos: []
      }
    });

  } catch (error) {
    console.error('Ошибка создания блока фотографий:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 