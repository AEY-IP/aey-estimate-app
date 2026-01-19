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
            OR: [
              { createdBy: session.id },
              { managerId: session.id }
            ]
          } 
        }),
        prisma.workItem.count({ where: { isActive: true } }),
        prisma.estimate.count({ 
          where: { 
            isAct: false,
            client: {
              OR: [
                { createdBy: session.id },
                { managerId: session.id }
              ]
            }
          } 
        })
      ])
      
      totalClients = managerClients
      totalWorks = allWorks  // Работы общие для всех
      totalEstimates = managerEstimates
    } else if (session.role === 'DESIGNER') {
      // Для дизайнеров считаем только клиентов привязанных к ним
      const [designerClients, designerEstimates] = await Promise.all([
        prisma.client.count({ 
          where: { 
            isActive: true,
            designerId: session.id
          } 
        }),
        prisma.estimate.count({ 
          where: { 
            isAct: false,
            client: {
              designerId: session.id
            }
          } 
        })
      ])
      
      totalClients = designerClients
      totalWorks = 0  // Дизайнеры не работают с работами
      totalEstimates = designerEstimates
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