const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Функция для безопасного создания даты
function safeDate(dateString) {
  if (!dateString) return new Date()
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? new Date() : date
}

async function restoreData() {
  try {
    console.log('🔄 Начинаю восстановление данных из бэкапов...')

    // Читаем данные из JSON файлов
    const dataDir = path.join(__dirname, '..', 'data')
    
    // Проверяем какие файлы существуют
    const files = fs.readdirSync(dataDir)
    console.log('📁 Доступные файлы:', files.filter(f => f.endsWith('.json')))

    // Используем самые свежие файлы
    const clients = JSON.parse(fs.readFileSync(path.join(dataDir, 'clients.json'), 'utf8'))
    const estimates = JSON.parse(fs.readFileSync(path.join(dataDir, 'estimates.json'), 'utf8')) // САМЫЙ СВЕЖИЙ от 20 июня!
    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'))
    
    // Коэффициенты и параметры помещений - проверяем существование
    let coefficients = []
    let roomParameters = []
    
    try {
      coefficients = JSON.parse(fs.readFileSync(path.join(dataDir, 'coefficients.json'), 'utf8'))
    } catch (e) {
      console.log('⚠️  Файл coefficients.json не найден или поврежден')
    }
    
    try {
      roomParameters = JSON.parse(fs.readFileSync(path.join(dataDir, 'room-parameters.json'), 'utf8'))
    } catch (e) {
      console.log('⚠️  Файл room-parameters.json не найден или поврежден')
    }

    console.log(`📊 Найдено данных:`)
    console.log(`   - Клиенты: ${clients.length}`)
    console.log(`   - Сметы: ${estimates.length} (СВЕЖИЕ от 20 июня!)`)
    console.log(`   - Пользователи: ${users.length}`)
    console.log(`   - Коэффициенты: ${coefficients.length}`)
    console.log(`   - Параметры помещений: ${roomParameters.length}`)

    // 1. Восстанавливаем пользователей
    console.log('\n👥 Восстанавливаю пользователей...')
    for (const user of users) {
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {
            name: user.name,
            email: user.email || `${user.username}@example.com`, // Создаем email из username
            role: user.role,
            passwordHash: user.passwordHash,
            updatedAt: safeDate(user.updatedAt)
          },
          create: {
            id: user.id,
            name: user.name,
            email: user.email || `${user.username}@example.com`, // Создаем email из username
            role: user.role,
            passwordHash: user.passwordHash,
            createdAt: safeDate(user.createdAt),
            updatedAt: safeDate(user.updatedAt)
          }
        })
        console.log(`   ✅ Пользователь: ${user.name} (${user.email || user.username})`)
      } catch (error) {
        console.log(`   ❌ Ошибка с пользователем ${user.name}: ${error.message}`)
      }
    }

    // 2. Восстанавливаем клиентов
    console.log('\n👤 Восстанавливаю клиентов...')
    for (const client of clients) {
      try {
        await prisma.client.upsert({
          where: { id: client.id },
          update: {
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            notes: client.notes || '',
            managerId: client.managerId,
            updatedAt: safeDate(client.updatedAt)
          },
          create: {
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            notes: client.notes || '',
            managerId: client.managerId,
            createdBy: client.createdBy || 'admin_1', // Используем admin_1 как создателя по умолчанию
            createdAt: safeDate(client.createdAt),
            updatedAt: safeDate(client.updatedAt)
          }
        })
        console.log(`   ✅ Клиент: ${client.name} (${client.email || 'без email'})`)
      } catch (error) {
        console.log(`   ❌ Ошибка с клиентом ${client.name}: ${error.message}`)
      }
    }

    // 3. Восстанавливаем работы
    console.log('\n🔨 Восстанавливаю работы...')
    
    try {
      const worksData = JSON.parse(fs.readFileSync(path.join(dataDir, 'works.json'), 'utf8'))
      
      if (worksData.works && Array.isArray(worksData.works)) {
        console.log(`   📊 Найдено ${worksData.works.length} работ для восстановления`)
        
        // Проверяем текущее количество работ
        const currentWorksCount = await prisma.work.count()
        console.log(`   📊 Текущее количество работ в БД: ${currentWorksCount}`)
        
        if (currentWorksCount === 0) {
          // Восстанавливаем работы порциями
          const batchSize = 100
          let restored = 0
          
          for (let i = 0; i < worksData.works.length; i += batchSize) {
            const batch = worksData.works.slice(i, i + batchSize)
            
            const worksToCreate = batch.map(work => ({
              id: work.id,
              name: work.name,
              unit: work.unit,
              basePrice: work.basePrice,
              category: work.category,
              description: work.description || null,
              parameterId: work.parameterId || null,
              isActive: work.isActive !== false,
              createdAt: safeDate(work.createdAt),
              updatedAt: safeDate(work.updatedAt)
            }))
            
            await prisma.work.createMany({
              data: worksToCreate,
              skipDuplicates: true
            })
            
            restored += worksToCreate.length
            console.log(`   📝 Восстановлено ${restored}/${worksData.works.length} работ...`)
          }
          
          console.log(`   ✅ Все работы восстановлены!`)
        } else {
          console.log(`   ⚠️  Работы уже есть в БД, пропускаю восстановление`)
        }
      }
    } catch (error) {
      console.log(`   ❌ Ошибка восстановления работ: ${error.message}`)
    }

    // 4. Восстанавливаем коэффициенты
    if (coefficients.length > 0) {
      console.log('\n📊 Восстанавливаю коэффициенты...')
      for (const coeff of coefficients) {
        try {
          await prisma.coefficient.upsert({
            where: { id: coeff.id },
            update: {
              name: coeff.name,
              value: coeff.value,
              type: coeff.type,
              updatedAt: safeDate(coeff.updatedAt)
            },
            create: {
              id: coeff.id,
              name: coeff.name,
              value: coeff.value,
              type: coeff.type,
              createdAt: safeDate(coeff.createdAt),
              updatedAt: safeDate(coeff.updatedAt)
            }
          })
          console.log(`   ✅ Коэффициент: ${coeff.name}`)
        } catch (error) {
          console.log(`   ❌ Ошибка с коэффициентом ${coeff.name}: ${error.message}`)
        }
      }
    }

    // 5. Восстанавливаем параметры помещений
    if (roomParameters.length > 0) {
      console.log('\n🏠 Восстанавливаю параметры помещений...')
      for (const param of roomParameters) {
        try {
          await prisma.roomParameter.upsert({
            where: { id: param.id },
            update: {
              name: param.name,
              unit: param.unit,
              updatedAt: safeDate(param.updatedAt)
            },
            create: {
              id: param.id,
              name: param.name,
              unit: param.unit,
              createdAt: safeDate(param.createdAt),
              updatedAt: safeDate(param.updatedAt)
            }
          })
          console.log(`   ✅ Параметр: ${param.name}`)
        } catch (error) {
          console.log(`   ❌ Ошибка с параметром ${param.name}: ${error.message}`)
        }
      }
    }

    // 6. Восстанавливаем сметы (САМОЕ ВАЖНОЕ - СВЕЖИЕ ДАННЫЕ!)
    console.log('\n📋 Восстанавливаю сметы (СВЕЖИЕ ДАННЫЕ ОТ 20 ИЮНЯ)...')
    for (const estimate of estimates) {
      try {
        // Создаем основную смету
        const createdEstimate = await prisma.estimate.upsert({
          where: { id: estimate.id },
          update: {
            title: estimate.title,
            type: estimate.type,
            category: estimate.category,
            clientId: estimate.clientId,
            totalWorksPrice: estimate.totalWorksPrice || 0,
            totalMaterialsPrice: estimate.totalMaterialsPrice || 0,
            totalPrice: estimate.totalPrice || 0,
            notes: estimate.notes || '',
            createdBy: estimate.createdBy,
            updatedAt: safeDate(estimate.updatedAt)
          },
          create: {
            id: estimate.id,
            title: estimate.title,
            type: estimate.type,
            category: estimate.category,
            clientId: estimate.clientId,
            totalWorksPrice: estimate.totalWorksPrice || 0,
            totalMaterialsPrice: estimate.totalMaterialsPrice || 0,
            totalPrice: estimate.totalPrice || 0,
            notes: estimate.notes || '',
            createdBy: estimate.createdBy,
            createdAt: safeDate(estimate.createdAt),
            updatedAt: safeDate(estimate.updatedAt)
          }
        })

        console.log(`   ✅ Смета: ${estimate.title} (ID: ${estimate.id})`)

        // Восстанавливаем комнаты для смет типа "rooms"
        if (estimate.type === 'rooms' && estimate.rooms) {
          for (const room of estimate.rooms) {
            try {
              await prisma.estimateRoom.upsert({
                where: { id: room.id },
                update: {
                  name: room.name,
                  estimateId: estimate.id,
                  totalWorksPrice: room.totalWorksPrice || 0,
                  totalMaterialsPrice: room.totalMaterialsPrice || 0,
                  totalPrice: room.totalPrice || 0,
                  updatedAt: safeDate(room.updatedAt)
                },
                create: {
                  id: room.id,
                  name: room.name,
                  estimateId: estimate.id,
                  totalWorksPrice: room.totalWorksPrice || 0,
                  totalMaterialsPrice: room.totalMaterialsPrice || 0,
                  totalPrice: room.totalPrice || 0,
                  createdAt: safeDate(room.createdAt),
                  updatedAt: safeDate(room.updatedAt)
                }
              })

              // Восстанавливаем работы комнаты
              if (room.worksBlock && room.worksBlock.blocks) {
                for (const block of room.worksBlock.blocks) {
                  if (block.items) {
                    for (const item of block.items) {
                      try {
                        await prisma.estimateWork.create({
                          data: {
                            id: item.id,
                            estimateId: estimate.id,
                            roomId: room.id,
                            workId: item.workId,
                            name: item.name,
                            unit: item.unit,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,
                            blockTitle: block.title,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          }
                        })
                      } catch (workError) {
                        // Игнорируем дубликаты работ
                        if (!workError.message.includes('Unique constraint')) {
                          console.log(`     ⚠️  Ошибка с работой ${item.name}: ${workError.message}`)
                        }
                      }
                    }
                  }
                }
              }

              console.log(`     ✅ Комната: ${room.name}`)
            } catch (roomError) {
              console.log(`     ❌ Ошибка с комнатой ${room.name}: ${roomError.message}`)
            }
          }
        }

        // Восстанавливаем работы для смет типа "apartment"
        if (estimate.type === 'apartment' && estimate.worksBlock && estimate.worksBlock.blocks) {
          for (const block of estimate.worksBlock.blocks) {
            if (block.items) {
              for (const item of block.items) {
                try {
                  await prisma.estimateWork.create({
                    data: {
                      id: item.id,
                      estimateId: estimate.id,
                      workId: item.workId,
                      name: item.name,
                      unit: item.unit,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      totalPrice: item.totalPrice,
                      blockTitle: block.title,
                      createdAt: new Date(),
                      updatedAt: new Date()
                    }
                  })
                } catch (workError) {
                  // Игнорируем дубликаты работ
                  if (!workError.message.includes('Unique constraint')) {
                    console.log(`     ⚠️  Ошибка с работой ${item.name}: ${workError.message}`)
                  }
                }
              }
            }
          }
        }

      } catch (error) {
        console.log(`   ❌ Ошибка со сметой ${estimate.title}: ${error.message}`)
      }
    }

    console.log('\n🎉 Восстановление данных завершено!')
    console.log('\n📊 Итоговая статистика:')
    
    try {
      const finalStats = await Promise.all([
        prisma.user.count(),
        prisma.client.count(),
        prisma.estimate.count(),
        prisma.estimateRoom.count(),
        prisma.estimateWork.count(),
        prisma.work.count(),
        prisma.coefficient.count(),
        prisma.roomParameter.count()
      ])

      console.log(`   - Пользователи: ${finalStats[0]}`)
      console.log(`   - Клиенты: ${finalStats[1]}`)
      console.log(`   - Сметы: ${finalStats[2]}`)
      console.log(`   - Комнаты смет: ${finalStats[3]}`)
      console.log(`   - Работы в сметах: ${finalStats[4]}`)
      console.log(`   - Справочник работ: ${finalStats[5]}`)
      console.log(`   - Коэффициенты: ${finalStats[6]}`)
      console.log(`   - Параметры помещений: ${finalStats[7]}`)
    } catch (statsError) {
      console.log('⚠️  Ошибка при получении статистики:', statsError.message)
    }

  } catch (error) {
    console.error('💥 Ошибка при восстановлении данных:', error)
  } finally {
    await prisma.$disconnect()
  }
}

restoreData() 