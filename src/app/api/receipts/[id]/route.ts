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
      return NextResponse.json({ error: 'Клиенты не могут удалять чеки' }, { status: 403 });
    }

    const receiptId = params.id;

    // Получаем чек с информацией о блоке и клиенте
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        block: {
          include: {
            client: true
          }
        }
      }
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Чек не найден' },
        { status: 404 }
      );
    }

    // Для менеджеров проверяем права доступа к клиенту
    if (session && session.role === 'MANAGER' && receipt.block.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Удаляем файл из Vercel Blob
    try {
      await del(receipt.filePath);
    } catch (error) {
      console.warn('Ошибка удаления файла из Blob:', error);
      // Продолжаем удаление записи из БД даже если файл не удалился
    }

    // Удаляем запись из БД
    await prisma.receipt.delete({
      where: { id: receiptId }
    });

    return NextResponse.json({
      success: true,
      message: 'Чек успешно удален'
    });

  } catch (error) {
    console.error('Ошибка удаления чека:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 