import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/database'


export const dynamic = 'force-dynamic'
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

    // Получаем блоки чеков с чеками для клиента
    const receiptBlocks = await prisma.receipt_blocks.findMany({
      where: {
        clientId: clientId,
        isVisible: true
      },
      include: {
        receipts: {
          where: {
            isVisible: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      receiptBlocks: receiptBlocks.map(block => ({
        id: block.id,
        title: block.title,
        description: block.description,
        createdAt: block.createdAt,
        receipts: block.receipts.map(receipt => ({
          id: receipt.id,
          fileName: receipt.fileName,
          filePath: receipt.filePath,
          fileSize: receipt.fileSize,
          mimeType: receipt.mimeType,
          description: receipt.description,
          createdAt: receipt.createdAt
        }))
      }))
    })
  } catch (error) {
    console.error('Client receipts error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 