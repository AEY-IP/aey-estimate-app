import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import { checkAuth, checkClientAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию (только админы могут удалять)
    const session = checkAuth(request);
    const clientSession = checkClientAuth(request);
    
    if (!session && !clientSession) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Блокируем удаление для клиентов
    if (clientSession && !session) {
      return NextResponse.json({ error: 'Клиенты не могут удалять фотографии' }, { status: 403 });
    }

    const photoId = params.id;

    // Получаем фотографию с информацией о блоке и клиенте
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        block: {
          include: {
            client: true
          }
        }
      }
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Фотография не найдена' },
        { status: 404 }
      );
    }

    // Для менеджеров проверяем права доступа к клиенту
    if (session && session.role === 'MANAGER' && photo.block.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Удаляем файл из Vercel Blob
    try {
      await del(photo.filePath);
    } catch (error) {
      console.warn('Ошибка удаления файла из Blob:', error);
      // Продолжаем удаление записи из БД даже если файл не удалился
    }

    // Удаляем запись из БД
    await prisma.photo.delete({
      where: { id: photoId }
    });

    return NextResponse.json({
      success: true,
      message: 'Фотография успешно удалена'
    });

  } catch (error) {
    console.error('Ошибка удаления фотографии:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 