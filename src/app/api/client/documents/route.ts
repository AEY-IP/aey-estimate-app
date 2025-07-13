import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database'

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

    // Получаем документы для клиента
    const documents = await prisma.document.findMany({
      where: {
        clientId: clientId,
        isVisible: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        description: doc.description,
        createdAt: doc.createdAt
      }))
    })
  } catch (error) {
    console.error('Client documents error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 