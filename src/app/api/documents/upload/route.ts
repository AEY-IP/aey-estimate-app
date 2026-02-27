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
    const blockId = formData.get('blockId') as string; // ID блока документов (необязательный)
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string || 'document'; // По умолчанию "document"

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: 'ID клиента не предоставлен' }, { status: 400 });
    }

    // Блокируем загрузку для клиентов
    if (userType === 'client') {
      return NextResponse.json({ error: 'Клиенты не могут загружать документы' }, { status: 403 });
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

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const key = `documents/${clientId}/${fileName}`;

    // Загружаем файл в Yandex Cloud
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile(buffer, key, file.type, false);

    // Сохраняем информацию о документе в БД
    const documentData: any = {
      clientId: clientId,
      name: name || file.name,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      filePath: key,
      description: description || '',
      category: category
    };

    // Добавляем blockId если указан (для блочной системы)
    if (blockId) {
      documentData.blockId = blockId;
    }

    const document = await prisma.documents.create({
      data: documentData
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        description: document.description,
        category: (document as any).category,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        filePath: document.filePath,
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Ошибка загрузки документа:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 