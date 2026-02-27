import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'
import { getSignedDownloadUrl } from '@/lib/storage'


export const dynamic = 'force-dynamic'
async function checkEstimateAccess(estimateId: string, sessionId: string, role: string) {
  const estimate = await prisma.designer_estimates.findUnique({
    where: { id: estimateId }
  })

  if (!estimate || !estimate.isActive) {
    return { error: 'Смета не найдена', status: 404 }
  }

  if (role === 'DESIGNER' && estimate.designerId !== sessionId) {
    return { error: 'Доступ запрещен', status: 403 }
  }

  if (role !== 'ADMIN' && role !== 'DESIGNER') {
    return { error: 'Недостаточно прав', status: 403 }
  }

  return { estimate }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const accessCheck = await checkEstimateAccess(params.id, session.id, session.role)
    if (accessCheck.error) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const blocks = await prisma.designer_estimate_blocks.findMany({
      where: {
        estimateId: params.id,
        isActive: true
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' }
        },
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Генерируем signed URLs и подсчитываем стоимость с учетом иерархии
    const blocksWithSignedUrls = await Promise.all(
      blocks.map(async (block) => {
        const itemsWithUrls = await Promise.all(
          block.items.map(async (item) => {
            if (item.imageUrl && !item.imageUrl.startsWith('http')) {
              return { ...item, imageUrl: await getSignedDownloadUrl(item.imageUrl, 3600) };
            }
            return item;
          })
        );
        
        // Обрабатываем дочерние блоки (если есть)
        const childrenWithUrls = await Promise.all(
          (block.children || []).map(async (child) => {
            const childItemsWithUrls = await Promise.all(
              (child.items || []).map(async (item) => {
                if (item.imageUrl && !item.imageUrl.startsWith('http')) {
                  return { ...item, imageUrl: await getSignedDownloadUrl(item.imageUrl, 3600) };
                }
                return item;
              })
            );
            const childTotal = childItemsWithUrls.reduce((sum, item) => sum + item.totalPrice, 0);
            return {
              ...child,
              items: childItemsWithUrls,
              totalAmount: childTotal,
              itemsCount: childItemsWithUrls.length
            };
          })
        );
        
        // Стоимость блока = items этого блока + сумма всех дочерних блоков
        const ownItemsTotal = itemsWithUrls.reduce((sum, item) => sum + item.totalPrice, 0);
        const childrenTotal = childrenWithUrls.reduce((sum, child) => sum + (child.totalAmount || 0), 0);
        const blockTotal = ownItemsTotal + childrenTotal;
        
        return {
          ...block,
          items: itemsWithUrls,
          children: childrenWithUrls,
          totalAmount: blockTotal,
          itemsCount: itemsWithUrls.length
        };
      })
    );

    return NextResponse.json({ blocks: blocksWithSignedUrls })
  } catch (error) {
    console.error('Error fetching blocks:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const accessCheck = await checkEstimateAccess(params.id, session.id, session.role)
    if (accessCheck.error) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const body = await request.json()
    const { name, description, parentId, level } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название блока обязательно' }, { status: 400 })
    }

    if (parentId) {
      const parentBlock = await prisma.designer_estimate_blocks.findUnique({
        where: { id: parentId }
      })

      if (!parentBlock || parentBlock.estimateId !== params.id) {
        return NextResponse.json({ error: 'Родительский блок не найден' }, { status: 404 })
      }
    }

    const maxSortOrder = await prisma.designer_estimate_blocks.findFirst({
      where: {
        estimateId: params.id,
        parentId: parentId || null,
        isActive: true
      },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const block = await prisma.designer_estimate_blocks.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        estimateId: params.id,
        parentId: parentId || null,
        level: level || 1,
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1
      },
      include: {
        items: true,
        parent: true,
        children: true
      }
    })

    return NextResponse.json({ block })
  } catch (error) {
    console.error('Error creating block:', error)
    return NextResponse.json({ error: 'Ошибка создания блока' }, { status: 500 })
  }
}
