import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { checkAuth, checkClientAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const category = searchParams.get('category'); // Фильтр по категории: "document", "estimate_main", "estimate_additional" или несколько через запятую

    if (!clientId) {
      return NextResponse.json({ error: 'ID клиента не предоставлен' }, { status: 400 });
    }

    // Для клиентов проверяем, что они запрашивают свои документы
    if (userType === 'client' && targetClientId && clientId !== targetClientId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Проверяем доступ к клиенту
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        isActive: true,
        ...(userType === 'client' && targetClientId ? { id: targetClientId } : {})
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    // Для менеджеров проверяем права доступа
    if (session && session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Формируем фильтр для категорий
    const whereClause: any = {
      clientId: clientId
    };

    if (category) {
      const categories = category.split(',').map(c => c.trim());
      whereClause.category = {
        in: categories
      };
    } else {
      // По умолчанию показываем только обычные документы (не сметы)
      whereClause.category = 'document';
    }

    // Получаем документы
    const documents = await prisma.document.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      documents: documents.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        category: doc.category || 'document',
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        filePath: doc.filePath,
        createdAt: doc.createdAt
      }))
    });

  } catch (error) {
    console.error('Ошибка получения документов:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 