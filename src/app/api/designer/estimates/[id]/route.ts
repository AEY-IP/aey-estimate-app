import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'
import { getSignedDownloadUrl } from '@/lib/storage'


export const dynamic = 'force-dynamic'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const estimate = await prisma.designerEstimate.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        designer: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        blocks: {
          where: { isActive: true },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' }
            },
            children: {
              where: { isActive: true },
              include: {
                items: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!estimate || !estimate.isActive) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    if (session.role === 'DESIGNER' && estimate.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role !== 'ADMIN' && session.role !== 'DESIGNER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Генерируем signed URLs для всех изображений в items
    const blocksWithSignedUrls = await Promise.all(
      estimate.blocks.map(async (block) => {
        const itemsWithUrls = await Promise.all(
          block.items.map(async (item) => {
            if (item.imageUrl && !item.imageUrl.startsWith('http')) {
              return { ...item, imageUrl: await getSignedDownloadUrl(item.imageUrl, 3600) };
            }
            return item;
          })
        );
        
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
            return { ...child, items: childItemsWithUrls };
          })
        );
        
        return { ...block, items: itemsWithUrls, children: childrenWithUrls };
      })
    );

    // Подсчет общей суммы с учетом иерархии
    const calculateBlockTotal = (block: any): number => {
      const ownItemsTotal = block.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      const childrenTotal = (block.children || []).reduce((sum: number, child: any) => {
        return sum + calculateBlockTotal(child);
      }, 0);
      return ownItemsTotal + childrenTotal;
    };

    const totalAmount = blocksWithSignedUrls.reduce((sum, block) => {
      // Считаем только родительские блоки (у которых нет parentId)
      if (!block.parentId) {
        return sum + calculateBlockTotal(block);
      }
      return sum;
    }, 0)

    return NextResponse.json({ 
      estimate: {
        ...estimate,
        blocks: blocksWithSignedUrls,
        totalAmount
      }
    })
  } catch (error) {
    console.error('Error fetching designer estimate:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const existingEstimate = await prisma.designerEstimate.findUnique({
      where: { id: params.id }
    })

    if (!existingEstimate || !existingEstimate.isActive) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    if (session.role === 'DESIGNER' && existingEstimate.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role !== 'ADMIN' && session.role !== 'DESIGNER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название сметы обязательно' }, { status: 400 })
    }

    const estimate = await prisma.designerEstimate.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      },
      include: {
        client: true,
        designer: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({ estimate })
  } catch (error) {
    console.error('Error updating designer estimate:', error)
    return NextResponse.json({ error: 'Ошибка обновления сметы' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const existingEstimate = await prisma.designerEstimate.findUnique({
      where: { id: params.id }
    })

    if (!existingEstimate) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    if (session.role === 'DESIGNER' && existingEstimate.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role !== 'ADMIN' && session.role !== 'DESIGNER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    await prisma.designerEstimate.update({
      where: { id: params.id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting designer estimate:', error)
    return NextResponse.json({ error: 'Ошибка удаления сметы' }, { status: 500 })
  }
}
