const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Функция для парсинга CSV (та же что в импорте)
function parseCSV(csvContent) {
  const lines = csvContent.split('\n')
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
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
        PRICE_RAW: values[5]?.trim()
      }
      
      if (row.KIND && row.MES) {
        data.push(row)
      }
    }
  }
  
  return data
}

async function checkManualPriceWorks() {
  try {
    console.log('🔍 Проверяем работы с ценой "вручную"...\n')
    
    // Читаем CSV
    const csvPath = path.join(__dirname, '..', 'Справочник работ.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const csvData = parseCSV(csvContent)
    
    // Находим работы с ценой "вручную"
    const manualPriceWorks = csvData.filter(work => 
      work.PRICE_RAW.toLowerCase().includes('вручную')
    )
    
    console.log(`📋 Найдено в CSV работ с ценой "вручную": ${manualPriceWorks.length}`)
    
    console.log('\n📄 Список работ с ценой "вручную":')
    manualPriceWorks.forEach((work, index) => {
      console.log(`${index + 1}. ${work.KIND} (${work.MES}) - ID: ${work.ID_AEY}`)
    })
    
    // Проверяем в базе данных
    console.log('\n🔍 Проверяем наличие в базе данных...')
    
    let foundInDB = 0
    let notFoundInDB = 0
    
    for (const work of manualPriceWorks) {
      const dbWork = await prisma.workItem.findFirst({
        where: {
          name: work.KIND,
          unit: work.MES
        }
      })
      
      if (dbWork) {
        foundInDB++
        console.log(`✅ Найдено в БД: ${work.KIND} (цена: ${dbWork.price})`)
      } else {
        notFoundInDB++
        console.log(`❌ НЕ найдено в БД: ${work.KIND}`)
      }
    }
    
    console.log(`\n📊 Статистика:`)
    console.log(`   Всего работ с ценой "вручную": ${manualPriceWorks.length}`)
    console.log(`   Найдено в БД: ${foundInDB}`)
    console.log(`   Не найдено в БД: ${notFoundInDB}`)
    
    // Проверяем работы с ценой = 0 в базе
    const zeroPriceWorks = await prisma.workItem.findMany({
      where: { price: 0 },
      select: { name: true, unit: true, price: true }
    })
    
    console.log(`\n💰 Работ с ценой = 0 в базе данных: ${zeroPriceWorks.length}`)
    
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkManualPriceWorks() 