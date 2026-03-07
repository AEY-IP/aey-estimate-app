import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { checkClientAuth } from '@/lib/auth';
import { prisma } from '@/lib/database'
import { getSignedDownloadUrl } from '@/lib/storage'


export const dynamic = 'force-dynamic'

async function toSignedUrl(filePath: string): Promise<string> {
  if (!filePath || filePath.startsWith('http')) {
    return filePath
  }

  try {
    const normalizedKey = filePath.replace(/^\/+/, '')
    return await getSignedDownloadUrl(normalizedKey, 3600)
  } catch (error) {
    console.error('Ошибка генерации signed URL для сметы:', filePath, error)
    return filePath
  }
}

export async function GET(request: NextRequest) {
  try {
    // Проверяем клиентскую авторизацию
    const clientSession = checkClientAuth(request);
    
    if (!clientSession) {
      // Fallback для JWT токена
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
      }

      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
        if (decoded.userType !== 'client') {
          return NextResponse.json({ error: 'Неверный тип токена' }, { status: 401 });
        }
      } catch (error) {
        return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 });
      }
    }

    const clientId = clientSession?.clientId;
    
    if (!clientId) {
      return NextResponse.json({ error: 'ID клиента не найден' }, { status: 400 });
    }

    // Получаем только PDF сметы клиента
    const whereClause: any = {
      clientId: clientId,
      category: {
        in: ['estimate_main', 'estimate_additional']
      },
      isVisible: true
    };

    const estimateDocuments = await prisma.documents.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const documentsWithSignedUrls = await Promise.all(
      estimateDocuments.map(async (doc: any) => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        category: doc.category || 'estimate_main',
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        filePath: await toSignedUrl(doc.filePath),
        createdAt: doc.createdAt
      }))
    )

    return NextResponse.json({
      success: true,
      documents: documentsWithSignedUrls
    });

  } catch (error) {
    console.error('Ошибка получения смет клиентом:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 