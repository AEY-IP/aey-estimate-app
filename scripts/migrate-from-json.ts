import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

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
  unit: string
  description?: string
  isActive: boolean
}

/**
 * Скрипт для одноразовой миграции данных из JSON файлов
 * Используется только при необходимости восстановления старых данных
 */
async function migrateFromJSON() {
  console.log('🔄 Начинаем миграцию данных из JSON файлов...')
  
  const dataPath = path.join(process.cwd(), 'data')
  
  // Миграция параметров помещений
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
          unit: param.unit,
          description: param.description,
          isActive: param.isActive,
        },
      })
    }
    console.log(`✅ Мигрировано ${parameters.length} параметров помещений`)
  } catch (error) {
    console.log('⚠️  Файл room-parameters.json не найден или поврежден')
  }

  // Миграция работ
  try {
    const worksData = fs.readFileSync(path.join(dataPath, 'works.json'), 'utf8')
    const worksJSON = JSON.parse(worksData)
    const works: any[] = worksJSON.works || worksJSON
    
    // Сначала создаем блоки работ
    const blockTitles = Array.from(new Set(works.map(w => w.category)))
    for (const title of blockTitles) {
      await prisma.workBlock.upsert({
        where: { id: `block_${title}` },
        update: {},
        create: {
          id: `block_${title}`,
          title,
          description: `Работы категории: ${title}`,
          isActive: true
        }
      })
    }
    
    // Затем создаем работы
    let migratedCount = 0
    for (const work of works) {
      await prisma.workItem.upsert({
        where: { id: work.id },
        update: {},
        create: {
          id: work.id,
          name: work.name,
          unit: work.unit,
          price: work.basePrice,
          description: work.description,
          parameterId: work.parameterId,
          isActive: work.isActive,
          blockId: `block_${work.category}`,
          createdAt: new Date(work.createdAt),
          updatedAt: new Date(work.updatedAt)
        }
      })
      migratedCount++
    }
    console.log(`✅ Мигрировано ${migratedCount} работ`)
  } catch (error) {
    console.log('⚠️  Файл works.json поврежден:', error)
  }

  // Миграция клиентов
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

  console.log('🎉 Миграция из JSON завершена!')
}

migrateFromJSON()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 