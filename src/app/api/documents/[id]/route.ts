import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { checkAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Сначала пробуем cookie-авторизацию (для админов)
    const session = checkAuth(request);
    let userId: string;
    let userType: 'admin' | 'client' = 'admin';

    if (session) {
      // Cookie-авторизация успешна
      userId = session.id;
      userType = 'admin';
    } else {
      // Пробуем JWT авторизацию (для клиентов)
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json({ error: 'Авторизация не предоставлена' }, { status: 401 });
      }

      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
        userId = decoded.userId;
        userType = decoded.userType || 'client';
      } catch (error) {
        return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 });
      }
    }

    // Получаем документ
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { client: true }
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    // Проверяем права доступа - только админы могут удалять
    if (userType === 'client') {
      return NextResponse.json({ error: 'Клиенты не могут удалять документы' }, { status: 403 });
    }

    // Для менеджеров проверяем права доступа к клиенту
    if (session && session.role === 'MANAGER' && document.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Удаляем файл из Vercel Blob
    try {
      await del(document.filePath);
    } catch (error) {
      console.warn('Ошибка удаления файла из Blob:', error);
      // Продолжаем удаление записи из БД даже если файл не удалился
    }

    // Удаляем запись из БД
    await prisma.document.delete({
      where: { id: documentId }
    });

    return NextResponse.json({
      success: true,
      message: 'Документ успешно удален'
    });

  } catch (error) {
    console.error('Ошибка удаления документа:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 