import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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

  // Создаём базовые коэффициенты только если их нет
  const existingCoefficients = await prisma.coefficient.count()
  if (existingCoefficients === 0) {
    await prisma.coefficient.createMany({
      data: [
        {
          id: 'coeff_1',
          name: 'Региональный коэффициент',
          value: 1.2,
          description: 'Коэффициент для регионов с повышенной стоимостью',
          isActive: true
        },
        {
          id: 'coeff_2', 
          name: 'Сложность работ',
          value: 1.5,
          description: 'Коэффициент за сложность выполнения работ',
          isActive: true
        },
        {
          id: 'coeff_3',
          name: 'Срочность',
          value: 1.3,
          description: 'Коэффициент за срочное выполнение',
          isActive: true
        }
      ]
    })
    console.log('✅ Создано 3 базовых коэффициента')
  } else {
    console.log('ℹ️  Коэффициенты уже существуют, пропускаем создание')
  }

  console.log('🎉 Инициализация завершена!')
  console.log('')
  console.log('📝 Все новые данные (клиенты, работы, сметы) сохраняются в PostgreSQL базу данных.')
  console.log('🌐 Данные доступны всем пользователям системы в реальном времени.')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 