import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { prisma } from '@/lib/database';
import { checkAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
  console.log('🧾 Receipts upload API called');

  try {
    // Проверяем авторизацию с помощью стандартной функции
    const session = checkAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    console.log('👤 User session:', { id: session.id, role: session.role });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const blockId = formData.get('blockId') as string;
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: 'ID клиента не предоставлен' }, { status: 400 });
    }

    if (!blockId) {
      return NextResponse.json({ error: 'ID блока не предоставлен' }, { status: 400 });
    }

    console.log('📄 File info:', {
      name: file.name,
      size: file.size,
      type: file.type,
      clientId,
      blockId
    });

    // Проверяем поддерживаемые типы
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Поддерживаются только изображения (JPG, PNG, WebP) и PDF файлы' 
      }, { status: 400 });
    }

    // Проверяем размер файла (100 МБ)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'Размер файла не должен превышать 100 МБ'
      }, { status: 400 });
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

    // Для менеджеров проверяем права доступа
    if (session.role === 'MANAGER' && client.createdBy !== session.id && client.managerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Находим или создаем блок чеков
    let receiptBlock = await prisma.receipt_blocks.findFirst({
      where: {
        id: blockId,
        clientId: clientId
      }
    });

    if (!receiptBlock) {
      // Создаем блок если он не существует
      receiptBlock = await prisma.receipt_blocks.create({
        data: {
          id: blockId,
          title: 'Чеки',
          clientId: clientId
        }
      });
      console.log('📁 Created new receipt block:', receiptBlock.id);
    }

    // Генерируем уникальное имя файла для Vercel Blob
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `receipts/${clientId}/${blockId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    console.log('🚀 Uploading to Yandex Cloud:', uniqueFileName);

    // Загружаем в Yandex Cloud
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile(buffer, uniqueFileName, file.type, false);

    console.log('✅ File uploaded:', uniqueFileName);

    // Сохраняем в базу данных
    const receipt = await prisma.receipts.create({
      data: {
        fileName: file.name,
        filePath: uniqueFileName,
        fileSize: file.size,
        mimeType: file.type,
        description: description || null,
        blockId: blockId
      }
    });

    console.log('💾 Receipt saved to database:', receipt.id);

    return NextResponse.json({
      receipt,
      url: uniqueFileName,
      message: 'Чек успешно загружен в Yandex Cloud'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки чека: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') },
      { status: 500 }
    );
  }
} 