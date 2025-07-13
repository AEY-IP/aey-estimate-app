import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkAuth, checkClientAuth } from '@/lib/auth';

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

    // Для клиентов проверяем, что они запрашивают свои чеки
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

    // Получаем блоки чеков с чеками
    const receiptBlocks = await prisma.receiptBlock.findMany({
      where: {
        clientId: clientId
      },
      include: {
        receipts: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      receiptBlocks: receiptBlocks.map((block: any) => ({
        id: block.id,
        title: block.title,
        description: block.description,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
        receipts: block.receipts.map((receipt: any) => ({
          id: receipt.id,
          fileName: receipt.fileName,
          filePath: receipt.filePath,
          fileSize: receipt.fileSize,
          mimeType: receipt.mimeType,
          description: receipt.description,
          createdAt: receipt.createdAt
        }))
      }))
    });

  } catch (error) {
    console.error('Ошибка получения чеков:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}



export async function POST(request: NextRequest) {
  try {
    // Создание нового блока чеков
    const session = checkAuth(request);
    const clientSession = checkClientAuth(request);
    
    if (!session && !clientSession) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Блокируем создание блоков для клиентов
    if (clientSession && !session) {
      return NextResponse.json({ error: 'Клиенты не могут создавать блоки чеков' }, { status: 403 });
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

    // Создаем блок чеков
    const receiptBlock = await prisma.receiptBlock.create({
      data: {
        clientId,
        title,
        description: description || ''
      }
    });

    return NextResponse.json({
      success: true,
      receiptBlock: {
        id: receiptBlock.id,
        title: receiptBlock.title,
        description: receiptBlock.description,
        createdAt: receiptBlock.createdAt,
        updatedAt: receiptBlock.updatedAt,
        receipts: []
      }
    });

  } catch (error) {
    console.error('Ошибка создания блока чеков:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 