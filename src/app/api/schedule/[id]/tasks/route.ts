import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkAuth, checkClientAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const session = checkAuth(request);
    const clientSession = checkClientAuth(request);
    
    if (!session && !clientSession) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const projectId = params.id;

    // Получаем проект с задачами
    const project = await prisma.scheduleProject.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          orderBy: [
            { level: 'asc' },
            { orderIndex: 'asc' }
          ]
        },
        client: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем права доступа
    if (session && session.role === 'MANAGER' && project.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    if (clientSession && project.clientId !== clientSession.clientId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      tasks: project.tasks.map((task: any) => ({
        id: task.id,
        parentId: task.parentId,
        title: task.title,
        description: task.description,
        level: task.level,
        orderIndex: task.orderIndex,
        plannedStart: task.plannedStart,
        plannedEnd: task.plannedEnd,
        actualStart: task.actualStart,
        actualEnd: task.actualEnd,
        progress: task.progress,
        status: task.status
      }))
    });

  } catch (error) {
    console.error('Ошибка получения задач:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== CREATE TASK API START ===');
    
    // Только админы могут создавать задачи
    const session = checkAuth(request);
    const clientSession = checkClientAuth(request);
    
    console.log('Auth check:', { session: !!session, clientSession: !!clientSession });
    
    if (!session && !clientSession) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Блокируем создание для клиентов
    if (clientSession && !session) {
      return NextResponse.json({ error: 'Клиенты не могут создавать задачи' }, { status: 403 });
    }

    const projectId = params.id;
    const body = await request.json();
    console.log('Request body:', body);
    console.log('Project ID:', projectId);
    
    const { 
      parentId, 
      title, 
      description, 
      level, 
      orderIndex, 
      plannedStart, 
      plannedEnd 
    } = body;

    if (!title || !plannedStart || !plannedEnd) {
      console.log('Missing required fields:', { title: !!title, plannedStart: !!plannedStart, plannedEnd: !!plannedEnd });
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 });
    }

    console.log('Looking for project:', projectId);
    
    // Проверяем существование проекта
    const project = await prisma.scheduleProject.findUnique({
      where: { id: projectId },
      include: { client: true }
    });

    console.log('Project found:', !!project);

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Проверяем права доступа
    if (session && session.role === 'MANAGER' && project.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    console.log('Creating task with data:', {
      projectId,
      parentId: parentId || null,
      title,
      description: description || '',
      level: level || 0,
      orderIndex: orderIndex || 0,
      plannedStart: new Date(plannedStart),
      plannedEnd: new Date(plannedEnd)
    });

    // Создаем задачу
    const task = await prisma.scheduleTask.create({
      data: {
        projectId,
        parentId: parentId || null,
        title,
        description: description || '',
        level: level || 0,
        orderIndex: orderIndex || 0,
        plannedStart: new Date(plannedStart),
        plannedEnd: new Date(plannedEnd)
      }
    });

    console.log('Task created successfully:', task.id);

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        parentId: task.parentId,
        title: task.title,
        description: task.description,
        level: task.level,
        orderIndex: task.orderIndex,
        plannedStart: task.plannedStart,
        plannedEnd: task.plannedEnd,
        actualStart: task.actualStart,
        actualEnd: task.actualEnd,
        progress: task.progress,
        status: task.status
      }
    });

  } catch (error) {
    console.error('=== CREATE TASK ERROR ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 