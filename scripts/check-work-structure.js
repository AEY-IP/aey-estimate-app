const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkWorkStructure() {
  try {
    const work = await prisma.workItem.findFirst()
    console.log('Структура WorkItem в БД:')
    console.log(JSON.stringify(work, null, 2))
    
    // Проверим общее количество
    const totalWorks = await prisma.workItem.count()
    console.log(`\nОбщее количество работ: ${totalWorks}`)
    
  } catch (error) {
    console.error('Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkStructure() 