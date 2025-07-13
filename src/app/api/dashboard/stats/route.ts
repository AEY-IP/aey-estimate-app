import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    let totalClients, totalWorks, totalEstimates

    if (session.role === 'MANAGER') {
      // Для менеджеров считаем только их данные
      const [managerClients, allWorks, managerEstimates] = await Promise.all([
        prisma.client.count({ 
          where: { 
            isActive: true,
            createdBy: session.id
          } 
        }),
        prisma.workItem.count({ where: { isActive: true } }),
        prisma.estimate.count({ 
          where: { 
            isAct: false,
            client: {
              createdBy: session.id
            }
          } 
        })
      ])
      
      totalClients = managerClients
      totalWorks = allWorks  // Работы общие для всех
      totalEstimates = managerEstimates
    } else {
      // Для админов получаем всю статистику
      const [allClients, allWorks, allEstimates] = await Promise.all([
        prisma.client.count({ where: { isActive: true } }),
        prisma.workItem.count({ where: { isActive: true } }),
        prisma.estimate.count({ where: { isAct: false } })
      ])
      
      totalClients = allClients
      totalWorks = allWorks
      totalEstimates = allEstimates
    }

    const stats = {
      totalClients,
      totalWorks,
      activeProjects: totalEstimates
    }

    return NextResponse.json({
      stats
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 