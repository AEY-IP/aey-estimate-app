import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';
import { prisma } from '@/lib/database';
import { checkAuth } from '@/lib/auth';

// Альтернативная функция загрузки через прямой fetch
async function uploadToVercelBlobDirect(fileName: string, buffer: Buffer, contentType: string): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN не настроен');
  }

  // Создаем form data
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: contentType }), fileName);

  console.log('🌐 Используем прямой fetch к Vercel Blob API...');

  const response = await fetch('https://blob.vercel-storage.com', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-content-type': contentType,
    },
    body: formData,
    signal: AbortSignal.timeout(30000) // 30 секунд таймаут
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vercel Blob API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.url;
}

// Функция для retry с экспоненциальной задержкой
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 3000
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const eventId = params.id;

    // Проверяем существование события
    const photoBlock = await prisma.photoBlock.findFirst({
      where: {
        id: eventId,
        client: {
          ...(user.role !== 'ADMIN' ? { createdBy: user.id } : {})
        }
      },
      include: {
        client: true
      }
    });

    if (!photoBlock) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Разрешены только изображения' }, { status: 400 });
    }

    // Проверяем размер файла (максимум 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'Файл слишком большой (максимум 100MB)' }, { status: 400 });
    }

    // Генерируем уникальное имя файла
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `photos/events/${eventId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    console.log('🚀 Uploading photo to Vercel Blob:', uniqueFileName);
    console.log('🔑 Token available:', !!process.env.BLOB_READ_WRITE_TOKEN);
    console.log('📁 File size:', Math.round(file.size / 1024), 'KB');
    console.log('🎨 File type:', file.type);

    // Конвертируем файл в Buffer для стабильности
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log('📦 Загружаем в Yandex Cloud...');
    await retryWithBackoff(async () => {
      return await uploadFile(buffer, uniqueFileName, file.type, false);
    }, 3, 2000);

    const fileUrl = uniqueFileName;
    console.log('✅ Загрузка успешна:', fileUrl);

    // Сохраняем в базу данных
    const photo = await prisma.photo.create({
      data: {
        fileName: file.name,
        filePath: fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        description: description || null,
        blockId: eventId
      }
    });

    console.log('✅ Photo saved to database:', photo.id);

    return NextResponse.json({ 
      success: true, 
      photo,
      message: 'Фотография успешно загружена в Vercel Blob'
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Более детальная информация об ошибке
    let errorMessage = 'Неизвестная ошибка';
    if (error instanceof Error) {
      if (error.message.includes('CONNECT_TIMEOUT') || error.message.includes('timeout')) {
        errorMessage = 'Таймаут соединения с Vercel Blob. Проблема может быть в сети или блокировке провайдера.';
      } else if (error.message.includes('EPIPE')) {
        errorMessage = 'Соединение прервано во время загрузки. Попробуйте файл меньшего размера.';
      } else if (error.message.includes('fetch failed')) {
        errorMessage = 'Ошибка сети при подключении к Vercel Blob. Проверьте интернет или попробуйте VPN.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Ошибка авторизации в Vercel Blob. Проверьте токен.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ 
      error: 'Ошибка загрузки в Vercel Blob: ' + errorMessage 
    }, { status: 500 });
  }
} 