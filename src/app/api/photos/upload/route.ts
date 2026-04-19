import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/database';
import { checkAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic'
// Функция для retry с экспоненциальной задержкой
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export async function POST(request: NextRequest) {
  console.log('=== PHOTOS UPLOAD API START (LEGACY) ===');
  console.log('📸 Photos upload API called (legacy endpoint)');
  console.log('🔍 Request method:', request.method);
  console.log('🔍 Request URL:', request.url);

  try {
    // Проверяем авторизацию с помощью стандартной функции
    console.log('🔐 Checking authentication...');
    const session = checkAuth(request);
    if (!session) {
      console.log('❌ No valid session found');
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
      }

    console.log('👤 User session:', { id: session.id, role: session.role });

    console.log('📋 Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const clientId = formData.get('clientId') as string;
    const blockId = formData.get('blockId') as string;
    const description = formData.get('description') as string || '';

    console.log('📝 Form data parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      clientId,
      blockId,
      description
    });

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    if (!clientId) {
      console.log('❌ No clientId provided');
      return NextResponse.json({ error: 'ID клиента не предоставлен' }, { status: 400 });
    }

    if (!blockId) {
      console.log('❌ No blockId provided');
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({ 
        error: 'Поддерживаются только изображения (JPG, PNG, WebP)' 
      }, { status: 400 });
    }

    // Проверяем размер файла (100 МБ)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'Размер файла не должен превышать 100 МБ'
      }, { status: 400 });
    }

    console.log('🔍 Checking client access...');
    // Проверяем доступ к клиенту
    const client = await prisma.clients.findFirst({
      where: {
        id: clientId,
        isActive: true
      }
    });

    if (!client) {
      console.log('❌ Client not found:', clientId);
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    console.log('✅ Client found:', { id: client.id, name: client.name });

    // Для менеджеров проверяем права доступа
    if (session.role === 'MANAGER' && client.createdBy !== session.id && client.managerId !== session.id) {
      console.log('❌ Access denied for manager:', { managerId: session.id, clientCreatedBy: client.createdBy });
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    console.log('🔍 Checking/creating photo block...');
    // Находим или создаем блок фотографий
    let photoBlock = await prisma.photo_blocks.findFirst({
      where: {
        id: blockId,
        clientId: clientId
      }
    });

    if (!photoBlock) {
      // Создаем блок если он не существует
      photoBlock = await prisma.photo_blocks.create({
        data: {
          id: blockId,
          title: 'Фотографии',
          clientId: clientId,
          updatedAt: new Date()
        }
      });
      console.log('📁 Created new photo block:', photoBlock.id);
    } else {
      console.log('📁 Using existing photo block:', photoBlock.id);
    }

    // Генерируем уникальное имя файла для Yandex Cloud
    const fileExtension = file.name.split('.').pop();
    const key = `photos/${clientId}/${blockId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    console.log('🚀 Uploading to Yandex Cloud:', key);

    // Загружаем в Yandex Cloud с retry механизмом
    const buffer = Buffer.from(await file.arrayBuffer());
    await retryWithBackoff(async () => {
      console.log('🚀 Attempting upload to Yandex Cloud...');
      return await uploadFile(buffer, key, file.type, false);
    }, 3, 2000);

    console.log('✅ File uploaded to Yandex Cloud:', key);

    console.log('💾 Saving to database...');
    // Сохраняем в базу данных
    const photo = await prisma.photos.create({
      data: {
        id: randomUUID(),
        fileName: file.name,
        filePath: key,
        fileSize: file.size,
        mimeType: file.type,
        description: description || null,
        blockId: blockId
      }
    });

    console.log('💾 Photo saved to database:', photo.id);

    console.log('📤 Returning JSON response');
    // Возвращаем JSON для AJAX запросов
    const response = {
      photo,
      url: key,
      message: 'Фотография успешно загружена в Yandex Cloud'
    };
    
    console.log('✅ Success response:', response);
    console.log('=== PHOTOS UPLOAD API END (SUCCESS - LEGACY) ===');
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Upload error (legacy):', error);
    console.error('❌ Error stack:', (error as Error).stack);
    console.error('❌ Error cause:', (error as any).cause);
    console.log('=== PHOTOS UPLOAD API END (ERROR - LEGACY) ===');
    
    return NextResponse.json(
      { error: 'Ошибка загрузки фотографии: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 