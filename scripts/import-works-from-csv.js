const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Функция для парсинга цены
function parsePrice(priceString) {
  if (!priceString) return 0
  
  const cleaned = priceString.trim().toLowerCase()
  
  // Если цена указана как "вручную" или подобные текстовые значения
  if (cleaned.includes('вручную') || cleaned.includes('договорная') || cleaned.includes('по договору')) {
    return 0
  }
  
  // Парсим числовое значение
  const numericPrice = parseFloat(cleaned.replace(/[^\d.,]/g, '').replace(',', '.'))
  return isNaN(numericPrice) ? 0 : numericPrice
}

// Функция для парсинга CSV
function parseCSV(csvContent) {
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',')
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Простой парсинг CSV с учетом кавычек
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    if (values.length >= 6) {
      const row = {
        ID_AEY: values[0]?.trim(),
        ID_PRIMARY: values[1]?.trim(), 
        CLASS: values[2]?.trim(),
        KIND: values[3]?.trim(),
        MES: values[4]?.trim(),
        PRICE: parsePrice(values[5])
      }
      
      if (row.KIND && row.MES) {
        data.push(row)
      }
    }
  }
  
  return data
}

// Функция для создания блоков работ
async function createWorkBlocks(categories) {
  const blocks = new Map()
  
  for (const category of categories) {
    let existingBlock = await prisma.workBlock.findFirst({
      where: { title: category }
    })
    
    if (!existingBlock) {
      existingBlock = await prisma.workBlock.create({
        data: {
          title: category,
          description: `Блок работ: ${category}`,
          isActive: true
        }
      })
      console.log(`✅ Создан блок: ${category}`)
    } else {
      console.log(`ℹ️  Блок уже существует: ${category}`)
    }
    
    blocks.set(category, existingBlock.id)
  }
  
  return blocks
}

// Основная функция импорта
async function importWorksFromCSV() {
  try {
    console.log('🚀 Начинаем импорт работ из CSV...\n')
    
    // Читаем CSV файл
    const csvPath = path.join(__dirname, '..', 'Справочник работ.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const csvData = parseCSV(csvContent)
    
    console.log(`📖 Прочитано ${csvData.length} записей из CSV\n`)
    
    // Получаем уникальные категории
    const categories = [...new Set(csvData.map(row => row.CLASS))]
    console.log(`📋 Найдено категорий: ${categories.length}`)
    
    // Создаем блоки работ
    console.log('\n🏗️  Создаем блоки работ...')
    const blockMap = await createWorkBlocks(categories)
    
    console.log('\n📥 Импортируем работы...')
    
    let imported = 0
    let skipped = 0
    
    for (const row of csvData) {
      try {
        const blockId = blockMap.get(row.CLASS)
        
        // Проверяем, существует ли уже такая работа
        const existingWork = await prisma.workItem.findFirst({
          where: {
            name: row.KIND,
            unit: row.MES
          }
        })
        
        if (existingWork) {
          // Обновляем цену если она изменилась
          if (existingWork.price !== row.PRICE) {
            await prisma.workItem.update({
              where: { id: existingWork.id },
              data: { 
                price: row.PRICE,
                updatedAt: new Date()
              }
            })
            const priceText = row.PRICE === 0 ? 'установлена как 0 (вручную)' : `обновлена на ${row.PRICE}`
            console.log(`🔄 Цена ${priceText}: ${row.KIND}`)
          }
          skipped++
          continue
        }
        
        // Создаем новую работу
        await prisma.workItem.create({
          data: {
            name: row.KIND,
            unit: row.MES,
            price: row.PRICE,
            description: `Импортировано из CSV. ID_AEY: ${row.ID_AEY}, ID_PRIMARY: ${row.ID_PRIMARY}`,
            isActive: true,
            blockId: blockId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        
        imported++
        
        if (imported % 100 === 0) {
          console.log(`   Импортировано: ${imported} работ...`)
        }
        
      } catch (error) {
        console.error(`❌ Ошибка импорта работы "${row.KIND}":`, error.message)
        skipped++
      }
    }
    
    console.log('\n✅ Импорт завершен!')
    console.log(`   Импортировано: ${imported} работ`)
    console.log(`   Пропущено: ${skipped} работ`)
    
  } catch (error) {
    console.error('❌ Ошибка импорта:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Запуск скрипта
importWorksFromCSV() 