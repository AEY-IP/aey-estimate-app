import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { checkAuth, checkClientAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
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
      // Пробуем JWT авторизацию (fallback для клиентов)
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json({ error: 'Авторизация не предоставлена' }, { status: 401 });
      }

      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
        userId = decoded.userId;
        userType = decoded.userType || 'client';
        if (userType === 'client') {
          targetClientId = decoded.clientId || decoded.userId;
        }
      } catch (error) {
        return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 });
      }
    }

    // Получаем данные формы
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const blockId = formData.get('blockId') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: 'ID клиента не предоставлен' }, { status: 400 });
    }

    if (!blockId) {
      return NextResponse.json({ error: 'ID блока не предоставлен' }, { status: 400 });
    }

    // Проверяем поддерживаемые типы файлов для чеков
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Поддерживаются только изображения (JPG, PNG) и PDF файлы' }, { status: 400 });
    }

    // Блокируем загрузку для клиентов
    if (userType === 'client') {
      return NextResponse.json({ error: 'Клиенты не могут загружать чеки' }, { status: 403 });
    }

    // Проверяем доступ к клиенту
    const client = await prisma.clients.findFirst({
      where: {
        id: clientId,
        isActive: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    // Для менеджеров проверяем права доступа к клиенту
    if (session && session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Проверяем что блок принадлежит клиенту
    const receiptBlock = await prisma.receiptBlock.findFirst({
      where: {
        id: blockId,
        clientId: clientId
      }
    });

    if (!receiptBlock) {
      return NextResponse.json({ error: 'Блок чеков не найден' }, { status: 404 });
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const key = `receipts/${clientId}/${fileName}`;

    // Загружаем файл в Yandex Cloud
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile(buffer, key, file.type, false);

    // Сохраняем информацию о чеке в БД
    const receipt = await prisma.receipt.create({
      data: {
        blockId: blockId,
        fileName: file.name,
        filePath: key,
        fileSize: file.size,
        mimeType: file.type,
        description: description || ''
      }
    });

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        fileName: receipt.fileName,
        filePath: receipt.filePath,
        fileSize: receipt.fileSize,
        mimeType: receipt.mimeType,
        description: receipt.description,
        createdAt: receipt.createdAt
      }
    });

  } catch (error) {
    console.error('Ошибка загрузки чека:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 