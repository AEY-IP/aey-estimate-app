import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;

    // Проверяем авторизацию
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Токен не предоставлен' }, { status: 401 });
    }

    try {
      jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    } catch (error) {
      return NextResponse.json({ error: 'Недействительный токен' }, { status: 401 });
    }

    // Получаем данные клиента
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        contractNumber: true,
        notes: true,
        createdAt: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client
    });

  } catch (error) {
    console.error('Ошибка получения клиента:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 