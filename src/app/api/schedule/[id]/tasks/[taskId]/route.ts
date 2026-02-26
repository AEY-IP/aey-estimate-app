import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkAuth, checkClientAuth } from '@/lib/auth';


export const dynamic = 'force-dynamic'
const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = checkAuth(request);
    const clientSession = checkClientAuth(request);
    
    if (!session && !clientSession) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Блокируем обновление для клиентов
    if (clientSession && !session) {
      return NextResponse.json({ error: 'Клиенты не могут изменять задачи' }, { status: 403 });
    }

    const taskId = params.taskId;
    const body = await request.json();

    // Проверяем существование задачи и права доступа
    const task = await prisma.scheduleTask.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            client: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    // Проверяем права доступа к проекту
    if (session && session.role === 'MANAGER' && task.project.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Обновляем задачу
    const updatedTask = await prisma.scheduleTask.update({
      where: { id: taskId },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.plannedStart && { plannedStart: new Date(body.plannedStart) }),
        ...(body.plannedEnd && { plannedEnd: new Date(body.plannedEnd) }),
        ...(body.actualStart && { actualStart: new Date(body.actualStart) }),
        ...(body.actualEnd && { actualEnd: new Date(body.actualEnd) }),
        ...(body.progress !== undefined && { progress: body.progress }),
        ...(body.status && { status: body.status }),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.orderIndex !== undefined && { orderIndex: body.orderIndex })
      }
    });

    return NextResponse.json({
      success: true,
      task: {
        id: updatedTask.id,
        parentId: updatedTask.parentId,
        title: updatedTask.title,
        description: updatedTask.description,
        level: updatedTask.level,
        orderIndex: updatedTask.orderIndex,
        plannedStart: updatedTask.plannedStart,
        plannedEnd: updatedTask.plannedEnd,
        actualStart: updatedTask.actualStart,
        actualEnd: updatedTask.actualEnd,
        progress: updatedTask.progress,
        status: updatedTask.status
      }
    });

  } catch (error) {
    console.error('Ошибка обновления задачи:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const session = checkAuth(request);
    const clientSession = checkClientAuth(request);
    
    if (!session && !clientSession) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Блокируем удаление для клиентов
    if (clientSession && !session) {
      return NextResponse.json({ error: 'Клиенты не могут удалять задачи' }, { status: 403 });
    }

    const taskId = params.taskId;

    // Проверяем существование задачи и права доступа
    const task = await prisma.scheduleTask.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            client: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    // Проверяем права доступа к проекту
    if (session && session.role === 'MANAGER' && task.project.client.createdBy !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Получаем все дочерние задачи для удаления
    const getAllChildrenIds = async (parentId: string): Promise<string[]> => {
      const children = await prisma.scheduleTask.findMany({
        where: { parentId },
        select: { id: true }
      });
      
      const childrenIds = children.map(child => child.id);
      const allDescendants = [];
      
      for (const childId of childrenIds) {
        const descendants = await getAllChildrenIds(childId);
        allDescendants.push(...descendants);
      }
      
      return [...childrenIds, ...allDescendants];
    };

    const childrenIds = await getAllChildrenIds(taskId);
    const allTasksToDelete = [taskId, ...childrenIds];

    // Удаляем все задачи (сначала дочерние, потом родительскую)
    await prisma.scheduleTask.deleteMany({
      where: {
        id: {
          in: allTasksToDelete
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Удалено задач: ${allTasksToDelete.length}`,
      deletedTaskIds: allTasksToDelete
    });

  } catch (error) {
    console.error('Ошибка удаления задачи:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 