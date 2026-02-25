import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { prisma } from '@/lib/database';
import { checkAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('📄 Documents upload API called');

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
    const title = formData.get('title') as string || file?.name || 'Документ';

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json({ error: 'ID клиента не предоставлен' }, { status: 400 });
    }

    console.log('📄 File info:', {
      name: file.name,
      size: file.size,
      type: file.type,
      clientId,
      title
    });

    // Проверяем поддерживаемые типы
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Поддерживаются только PDF, DOC, DOCX, XLS, XLSX, JPG, PNG файлы' 
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
    if (session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Генерируем уникальное имя файла для Vercel Blob
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `documents/${clientId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    console.log('🚀 Uploading to Yandex Cloud:', uniqueFileName);

    // Загружаем в Yandex Cloud
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile(buffer, uniqueFileName, file.type, false);

    console.log('✅ File uploaded:', uniqueFileName);

    // Сохраняем в базу данных
    const document = await prisma.document.create({
      data: {
        name: title,
        fileName: file.name,
        filePath: uniqueFileName,
        fileSize: file.size,
        mimeType: file.type,
        clientId: clientId
      }
    });

    console.log('💾 Document saved to database:', document.id);

    return NextResponse.json({
      document,
      url: uniqueFileName,
      message: 'Документ успешно загружен в Yandex Cloud'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки документа: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка') },
      { status: 500 }
    );
  }
} 