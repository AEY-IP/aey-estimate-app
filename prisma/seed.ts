import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface JSONUser {
  id: string
  username: string
  passwordHash: string
  role: string
  name: string
  phone?: string
  createdAt: string
  isActive: boolean
}

interface JSONClient {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  contractNumber?: string
  notes?: string
  createdBy: string
  createdAt: string
  isActive: boolean
}

interface JSONWorkItem {
  id: string
  name: string
  unit: string
  basePrice: number
  category: string
  description?: string
  parameterId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface JSONRoomParameter {
  id: string
  name: string
  description?: string
  isActive: boolean
}

interface JSONCoefficient {
  id: string
  name: string
  value: number
  description?: string
  isActive: boolean
}

async function main() {
  console.log('🌱 Seeding database...')

  // Создаём админа
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: 'admin_1',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      name: 'Администратор',
      phone: '',
      isActive: true
    }
  })

  console.log('✅ Admin created:', admin)

  // Создаём тестового менеджера
  const managerPasswordHash = await bcrypt.hash('manager123', 10)
  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      id: 'manager_1',
      username: 'manager',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
      name: 'Тестовый Менеджер',
      phone: '+7 (999) 123-45-67',
      isActive: true
    }
  })

  console.log('✅ Manager created:', manager)

  // Читаем данные из JSON файлов
  const dataPath = path.join(process.cwd(), 'data')
  
  // 1. Миграция пользователей
  console.log('👤 Мигрируем пользователей...')
  try {
    const usersData = fs.readFileSync(path.join(dataPath, 'users.json'), 'utf8')
    const users: JSONUser[] = JSON.parse(usersData)
    
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          username: user.username,
          passwordHash: user.passwordHash,
          role: user.role,
          name: user.name,
          phone: user.phone,
          isActive: user.isActive,
          createdAt: new Date(user.createdAt),
        },
      })
    }
    console.log(`✅ Мигрировано ${users.length} пользователей`)
  } catch (error) {
    console.log('⚠️  Файл users.json не найден или поврежден')
  }

  // 2. Миграция параметров помещений
  console.log('🏠 Мигрируем параметры помещений...')
  try {
    const parametersData = fs.readFileSync(path.join(dataPath, 'room-parameters.json'), 'utf8')
    const data = JSON.parse(parametersData)
    const parameters: JSONRoomParameter[] = data.parameters || []
    
    for (const param of parameters) {
      await prisma.roomParameter.upsert({
        where: { id: param.id },
        update: {},
        create: {
          id: param.id,
          name: param.name,
          description: param.description,
          isActive: param.isActive,
        },
      })
    }
    console.log(`✅ Мигрировано ${parameters.length} параметров помещений`)
  } catch (error) {
    console.log('⚠️  Файл room-parameters.json не найден или поврежден')
  }

  // 3. Миграция работ
  console.log('🔨 Мигрируем работы...')
  try {
    const worksData = fs.readFileSync(path.join(dataPath, 'works.json'), 'utf8')
    const data = JSON.parse(worksData)
    const works: JSONWorkItem[] = data.works || data

    let migratedCount = 0
    for (const work of works) {
      await prisma.workItem.upsert({
        where: { id: work.id },
        update: {},
        create: {
          id: work.id,
          name: work.name,
          unit: work.unit,
          basePrice: work.basePrice,
          category: work.category,
          description: work.description,
          parameterId: work.parameterId,
          isActive: work.isActive,
          createdAt: new Date(work.createdAt),
          updatedAt: new Date(work.updatedAt),
        },
      })
      migratedCount++
      
      // Показываем прогресс каждые 100 записей
      if (migratedCount % 100 === 0) {
        console.log(`   Обработано ${migratedCount} работ...`)
      }
    }
    console.log(`✅ Мигрировано ${works.length} работ`)
  } catch (error) {
    console.log('⚠️  Файл works.json не найден или поврежден:', error)
  }

  // 4. Миграция коэффициентов
  console.log('📊 Мигрируем коэффициенты...')
  try {
    const coefficientsData = fs.readFileSync(path.join(dataPath, 'coefficients.json'), 'utf8')
    const data = JSON.parse(coefficientsData)
    const coefficients: JSONCoefficient[] = data.coefficients || []
    
    for (const coeff of coefficients) {
      await prisma.coefficient.upsert({
        where: { id: coeff.id },
        update: {},
        create: {
          id: coeff.id,
          name: coeff.name,
          value: coeff.value,
          description: coeff.description,
          isActive: coeff.isActive,
        },
      })
    }
    console.log(`✅ Мигрировано ${coefficients.length} коэффициентов`)
  } catch (error) {
    console.log('⚠️  Файл coefficients.json не найден или поврежден')
  }

  // 5. Миграция клиентов
  console.log('👥 Мигрируем клиентов...')
  try {
    const clientsData = fs.readFileSync(path.join(dataPath, 'clients.json'), 'utf8')
    const clients: JSONClient[] = JSON.parse(clientsData)
    
    for (const client of clients) {
      await prisma.client.upsert({
        where: { id: client.id },
        update: {},
        create: {
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email,
          address: client.address,
          contractNumber: client.contractNumber,
          notes: client.notes,
          createdBy: client.createdBy,
          isActive: client.isActive,
          createdAt: new Date(client.createdAt),
        },
      })
    }
    console.log(`✅ Мигрировано ${clients.length} клиентов`)
  } catch (error) {
    console.log('⚠️  Файл clients.json не найден или поврежден')
  }

  // 6. Миграция смет (базовая структура, без детализации)
  console.log('📋 Мигрируем сметы...')
  try {
    const estimatesData = fs.readFileSync(path.join(dataPath, 'estimates.json'), 'utf8')
    const estimates: any[] = JSON.parse(estimatesData)
    
    for (const estimate of estimates) {
      await prisma.estimate.upsert({
        where: { id: estimate.id },
        update: {},
        create: {
          id: estimate.id,
          title: estimate.title,
          type: estimate.type,
          category: estimate.category,
          clientId: estimate.clientId,
          createdBy: estimate.createdBy,
          totalWorksPrice: estimate.totalWorksPrice || 0,
          totalMaterialsPrice: estimate.totalMaterialsPrice || 0,
          totalPrice: estimate.totalPrice || 0,
          status: estimate.status || 'draft',
          notes: estimate.notes,
          createdAt: new Date(estimate.createdAt),
          updatedAt: new Date(estimate.updatedAt),
        },
      })
    }
    console.log(`✅ Мигрировано ${estimates.length} смет`)
  } catch (error) {
    console.log('⚠️  Файл estimates.json не найден или поврежден:', error)
  }

  console.log('🎉 Миграция завершена!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 