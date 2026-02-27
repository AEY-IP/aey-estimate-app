import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { PrismaClient } from '@prisma/client';
import { checkAuth, checkClientAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Авторизация
    const session = checkAuth(request);
    const clientSession = checkClientAuth(request);
    
    let userId: string;
    let userType: 'admin' | 'client' = 'admin';

    if (session) {
      userId = session.id;
      userType = 'admin';
    } else if (clientSession) {
      userId = clientSession.clientUserId;
      userType = 'client';
    } else {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Блокируем загрузку для клиентов
    if (userType === 'client') {
      return NextResponse.json({ error: 'Клиенты не могут загружать чеки' }, { status: 403 });
    }

    const blockId = params.id;

    // Проверяем существование блока чеков
    const receiptBlock = await prisma.receipt_blocks.findFirst({
      where: {
        id: blockId,
        isVisible: true
      },
      include: {
        client: true
      }
    });

    if (!receiptBlock) {
      return NextResponse.json({ error: 'Блок чеков не найден' }, { status: 404 });
    }

    // Проверяем права доступа к клиенту для менеджеров
    if (session && session.role === 'MANAGER' && receiptBlock.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Получаем файл из формы
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'Недопустимый тип файла. Разрешены только изображения и PDF.' 
      }, { status: 400 });
    }

    // Проверяем размер файла (макс 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'Файл слишком большой. Максимум 100MB.'
      }, { status: 400 });
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const key = `receipts/${receiptBlock.clientId}/${blockId}/${fileName}`;

    // Загружаем файл в Yandex Cloud
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile(buffer, key, file.type, false);

    // Сохраняем информацию о чеке в БД
    const receipt = await prisma.receipts.create({
      data: {
        blockId: blockId,
        fileName: file.name,
        filePath: key,
        fileSize: file.size,
        mimeType: file.type,
        description: '',
        uploadedBy: userId,
        isVisible: true,
        sortOrder: 0,
        tags: []
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