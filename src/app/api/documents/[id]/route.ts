import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient();

// GET - получение одного документа
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    // Проверяем доступ к клиенту документа
    const client = await prisma.client.findFirst({
      where: { id: document.clientId, isActive: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    // Для менеджеров проверяем права доступа
    if (session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        description: document.description,
        category: (document as any).category || 'document',
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        filePath: document.filePath,
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Ошибка получения документа:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// PUT - редактирование документа
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    // Проверяем доступ к клиенту документа
    const client = await prisma.client.findFirst({
      where: { id: document.clientId, isActive: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    // Для менеджеров проверяем права доступа
    if (session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Обновляем документ
    const updateData: any = {
      name: name.trim(),
      description: description || '',
      updatedAt: new Date()
    };

    if (category) {
      updateData.category = category;
    }

    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      document: {
        id: updatedDocument.id,
        name: updatedDocument.name,
        description: updatedDocument.description,
        category: (updatedDocument as any).category || 'document',
        fileName: updatedDocument.fileName,
        fileSize: updatedDocument.fileSize,
        mimeType: updatedDocument.mimeType,
        filePath: updatedDocument.filePath,
        createdAt: updatedDocument.createdAt,
        updatedAt: updatedDocument.updatedAt
      }
    });

  } catch (error) {
    console.error('Ошибка редактирования документа:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// DELETE - удаление документа
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id }
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    // Проверяем доступ к клиенту документа
    const client = await prisma.client.findFirst({
      where: { id: document.clientId, isActive: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    // Для менеджеров проверяем права доступа
    if (session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Удаляем документ из БД
    await prisma.document.delete({
      where: { id: params.id }
    });

    // TODO: Можно добавить удаление файла из Vercel Blob, но это не критично
    // так как файлы не занимают много места и это может быть опасно

    return NextResponse.json({
      success: true,
      message: 'Документ успешно удален'
    });

  } catch (error) {
    console.error('Ошибка удаления документа:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 