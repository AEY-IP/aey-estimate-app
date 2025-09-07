const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateTemplates() {
  console.log('🚀 Начинаем миграцию шаблонов к блочной структуре...')
  
  try {
    // Получаем все активные шаблоны
    const templates = await prisma.template.findMany({
      where: { isActive: true },
      include: {
        rooms: {
          include: {
            works: {
              include: {
                workItem: {
                  include: {
                    block: true
                  }
                }
              }
            }
          }
        }
      }
    })

    console.log(`📋 Найдено ${templates.length} шаблонов для миграции`)

    for (const template of templates) {
      console.log(`\n🔄 Обрабатываем шаблон: ${template.name}`)
      
      for (const room of template.rooms) {
        console.log(`  📁 Обрабатываем помещение: ${room.name}`)
        
        if (room.works.length === 0) {
          console.log(`    ⏭️  Помещение пустое, пропускаем`)
          continue
        }

        // Группируем работы по категориям (blockTitle или категория workItem)
        const worksByCategory = {}
        
        for (const work of room.works) {
          let categoryName = 'Разные работы' // По умолчанию
          
          if (work.blockTitle) {
            categoryName = work.blockTitle
          } else if (work.workItem?.block?.title) {
            categoryName = work.workItem.block.title
          }
          
          if (!worksByCategory[categoryName]) {
            worksByCategory[categoryName] = []
          }
          
          worksByCategory[categoryName].push(work)
        }

        console.log(`    📊 Найдено ${Object.keys(worksByCategory).length} категорий работ`)

        // Создаем блоки работ для каждой категории
        for (const [categoryName, works] of Object.entries(worksByCategory)) {
          console.log(`      🔨 Создаем блок: ${categoryName} (${works.length} работ)`)
          
          // Создаем блок работ
          const workBlock = await prisma.templateWorkBlock.create({
            data: {
              title: categoryName,
              description: `Блок работ: ${categoryName}`,
              roomId: room.id,
              totalPrice: works.reduce((sum, work) => sum + work.totalPrice, 0),
              sortOrder: Object.keys(worksByCategory).indexOf(categoryName) + 1
            }
          })

          // Привязываем работы к блоку
          for (const work of works) {
            await prisma.templateWork.update({
              where: { id: work.id },
              data: { workBlockId: workBlock.id }
            })
          }

          console.log(`      ✅ Блок "${categoryName}" создан с ${works.length} работами`)
        }
      }
      
      console.log(`  ✅ Шаблон "${template.name}" успешно мигрирован`)
    }

    console.log('\n🎉 Миграция завершена успешно!')
    console.log('📝 Все существующие работы в шаблонах теперь сгруппированы в блоки')
    
  } catch (error) {
    console.error('❌ Ошибка при миграции:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Запускаем миграцию
migrateTemplates()
  .then(() => {
    console.log('✨ Миграция завершена')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Миграция провалилась:', error)
    process.exit(1)
  })
