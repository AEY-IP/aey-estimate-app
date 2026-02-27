import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkAuth, checkClientAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const session = checkAuth(request);
    const clientSession = checkClientAuth(request);
    
    let userId: string;
    let userType: 'admin' | 'client' = 'admin';
    let targetClientId: string | null = null;

    if (session) {
      userId = session.id;
      userType = 'admin';
    } else if (clientSession) {
      userId = clientSession.clientUserId;
      userType = 'client';
      targetClientId = clientSession.clientId;
    } else {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'ID клиента не предоставлен' }, { status: 400 });
    }

    // Для клиентов проверяем, что они запрашивают свои графики
    if (userType === 'client' && targetClientId && clientId !== targetClientId) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Проверяем доступ к клиенту
    const client = await prisma.clients.findFirst({
      where: {
        id: clientId,
        isActive: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    // Для менеджеров проверяем права доступа
    if (session && session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Получаем проекты графиков
    const whereCondition: any = {
      clientId: clientId
    };

    // Для клиентов показываем только графики с showToClient = true
    if (userType === 'client') {
      whereCondition.showToClient = true;
    }

    const projects = await prisma.schedule_projects.findMany({
      where: whereCondition,
      include: {
        tasks: {
          orderBy: [
            { level: 'asc' },
            { orderIndex: 'asc' }
          ]
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      projects: projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        showToClient: project.showToClient,
        createdAt: project.createdAt,
        tasks: project.tasks.map(task => ({
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
      }))
    });

  } catch (error) {
    console.error('Ошибка получения графиков:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Только админы могут создавать графики
    const session = checkAuth(request);
    const clientSession = checkClientAuth(request);
    
    if (!session && !clientSession) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Блокируем создание для клиентов
    if (clientSession && !session) {
      return NextResponse.json({ error: 'Клиенты не могут создавать графики' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, title, description, startDate, endDate } = body;

    if (!clientId || !title || !startDate || !endDate) {
      return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 });
    }

    // Проверяем доступ к клиенту
    const client = await prisma.clients.findFirst({
      where: {
        id: clientId,
        isActive: true
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Клиент не найден' }, { status: 404 });
    }

    // Для менеджеров проверяем права доступа
    if (session && session.role === 'MANAGER' && client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Создаем проект графика
    const project = await prisma.schedule_projects.create({
      data: {
        clientId,
        title,
        description: description || '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: session!.id
      }
    });

    // Создаем стандартные задачи уровня LVL 1
    const standardTasks = [
      'Демонтажные работы - Стены',
      'Демонтажные работы - Пол', 
      'Демонтажные работы - Потолок',
      'Демонтажные работы - Двери, окна',
      'Демонтажные работы - Электрика',
      'Демонтажные работы - Сантехника',
      'Демонтажные работы - Прочее',
      'Стены - черновой этап',
      'Стены - чистовой этап',
      'Пол - черновой этап',
      'Пол - чистовой этап',
      'Потолок - черновой этап',
      'Потолок - чистовой этап',
      'Электрика - черновой этап',
      'Электрика - чистовой этап',
      'Сантехника - черновой этап',
      'Сантехника - чистовой этап',
      'Вентиляция',
      'Прочее'
    ];

    // Создаем задачи в базе данных
    const createdTasks = [];
    for (let i = 0; i < standardTasks.length; i++) {
      const task = await prisma.schedule_tasks.create({
        data: {
          projectId: project.id,
          title: standardTasks[i],
          description: '',
          level: 0, // LVL 1 (индекс с 0)
          orderIndex: i,
          plannedStart: new Date(startDate), // Временные даты, требуют редактирования
          plannedEnd: new Date(endDate),
          progress: 0,
          status: 'waiting'
        }
      });
      
      createdTasks.push({
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
      });
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
        createdAt: project.createdAt,
        tasks: createdTasks
      }
    });

  } catch (error) {
    console.error('Ошибка создания графика:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 