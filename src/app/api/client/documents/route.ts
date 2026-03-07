import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
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
    console.error('Ошибка генерации signed URL для документа:', filePath, error)
    return filePath
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('client-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    if (decoded.type !== 'client') {
      return NextResponse.json(
        { error: 'Неверный тип токена' },
        { status: 401 }
      )
    }

    const clientId = decoded.clientId

    // Получаем только обычные документы для клиента (не сметы)
    const whereClause: any = {
      clientId: clientId,
      isVisible: true,
      category: 'document'
    };

    const documents = await prisma.documents.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const documentsWithSignedUrls = await Promise.all(
      documents.map(async (doc: any) => ({
        id: doc.id,
        name: doc.name,
        fileName: doc.fileName,
        filePath: await toSignedUrl(doc.filePath),
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        description: doc.description,
        category: doc.category || 'document',
        createdAt: doc.createdAt
      }))
    )

    return NextResponse.json({
      documents: documentsWithSignedUrls
    })
  } catch (error) {
    console.error('Client documents error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 