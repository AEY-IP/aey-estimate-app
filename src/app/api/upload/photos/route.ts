import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
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
  console.log('=== PHOTOS UPLOAD API START ===');
  console.log('📸 Photos upload API called');
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

    // Проверяем если это запрос с filename в query (как в документации Vercel)
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (filename) {
      console.log('🔄 Using direct body upload (Vercel docs style)');
      console.log('📄 Filename from query:', filename);
      
      if (!request.body) {
        console.log('❌ No request body provided');
        return NextResponse.json({ error: 'Тело запроса отсутствует' }, { status: 400 });
      }
      
      // Генерируем уникальное имя файла
      const fileExtension = filename.split('.').pop();
      const uniqueFileName = `photos/direct-upload/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      
      console.log('🚀 Uploading to Yandex Cloud (direct body):', uniqueFileName);
      
      // Загружаем в Yandex Cloud
      const buffer = Buffer.from(await request.arrayBuffer());
      await retryWithBackoff(async () => {
        console.log('🚀 Attempting direct body upload to Yandex Cloud...');
        return await uploadFile(buffer, uniqueFileName, 'image/jpeg', false);
      }, 3, 2000);

      console.log('✅ File uploaded to Yandex Cloud:', uniqueFileName);
      console.log('=== PHOTOS UPLOAD API END (SUCCESS - direct body) ===');
      
      return NextResponse.json({ url: uniqueFileName });
    }

    // Основной путь с FormData
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
          clientId: clientId
        }
      });
      console.log('📁 Created new photo block:', photoBlock.id);
    } else {
      console.log('📁 Using existing photo block:', photoBlock.id);
    }

    // Генерируем уникальное имя файла для Vercel Blob
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `photos/${clientId}/${blockId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    console.log('🚀 Uploading to Yandex Cloud:', uniqueFileName);

    // Загружаем в Yandex Cloud с retry механизмом
    const buffer = Buffer.from(await file.arrayBuffer());
    await retryWithBackoff(async () => {
      console.log('🚀 Attempting upload to Yandex Cloud...');
      return await uploadFile(buffer, uniqueFileName, file.type, false);
    }, 3, 2000);

    console.log('✅ File uploaded to Yandex Cloud:', uniqueFileName);

    console.log('💾 Saving to database...');
    // Сохраняем в базу данных
    const photo = await prisma.photos.create({
      data: {
        fileName: file.name,
        filePath: uniqueFileName,
        fileSize: file.size,
        mimeType: file.type,
        description: description || null,
        blockId: blockId
      }
    });

    console.log('💾 Photo saved to database:', photo.id);

    // Проверяем если это AJAX запрос (а не обычная HTML форма)
    const contentType = request.headers.get('content-type');
    const isAjaxRequest = request.headers.get('x-requested-with') === 'XMLHttpRequest' || 
                         request.headers.get('accept')?.includes('application/json') ||
                         contentType?.includes('application/json');
    
    console.log('🔍 Request type check:', {
      contentType,
      xRequestedWith: request.headers.get('x-requested-with'),
      accept: request.headers.get('accept'),
      isAjaxRequest
    });

    if (!isAjaxRequest) {
      console.log('📄 Returning HTML response for non-AJAX request');
      // Возвращаем HTML страницу для обычных форм
      return new Response(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Фото загружено</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px; 
              text-align: center;
              background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
            }
            .success { 
              background: #d1fae5; 
              border: 2px solid #10b981; 
              padding: 20px; 
              border-radius: 10px; 
              margin-bottom: 20px;
            }
            .success h1 { color: #065f46; margin: 0 0 10px 0; }
            .success p { color: #047857; margin: 0; }
            .back-btn {
              display: inline-block;
              background: #ec4899;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin-top: 20px;
            }
            .back-btn:hover { background: #db2777; }
            .file-info {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>✅ Фотография успешно загружена!</h1>
            <p>Файл сохранен в Vercel Blob и добавлен в галерею</p>
          </div>
          
          <div class="file-info">
            <strong>Информация о файле:</strong><br>
            📸 Имя: ${photo.fileName}<br>
            📏 Размер: ${Math.round(photo.fileSize / 1024)} КБ<br>
            🆔 ID: ${photo.id}<br>
            🌐 URL: ${uniqueFileName}
          </div>
          
                          <a href="/dashboard/clients/${clientId}/photos" class="back-btn">
            ← Вернуться к фотографиям
          </a>
          
          <script>
            // Автоматический возврат через 3 секунды
            setTimeout(() => {
              window.location.href = '/dashboard/clients/${clientId}/photos';
            }, 3000);
          </script>
        </body>
        </html>
      `, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8'
        }
      });
    }

    console.log('📤 Returning JSON response for AJAX request');
    // Возвращаем JSON для AJAX запросов
    const response = {
      photo,
      url: uniqueFileName,
      message: 'Фотография успешно загружена в Yandex Cloud'
    };
    
    console.log('✅ Success response:', response);
    console.log('=== PHOTOS UPLOAD API END (SUCCESS) ===');
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('❌ Error stack:', (error as Error).stack);
    console.error('❌ Error cause:', (error as any).cause);
    console.log('=== PHOTOS UPLOAD API END (ERROR) ===');
    
    return NextResponse.json(
      { error: 'Ошибка загрузки фотографии: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 