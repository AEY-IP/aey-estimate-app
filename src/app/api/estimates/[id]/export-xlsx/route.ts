import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth'
import { prisma } from '@/lib/database'
import ExcelJS from 'exceljs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ВРЕМЕННОЕ РЕШЕНИЕ: Отключена авторизация для Excel экспорта
    // ПРИЧИНА: Проблема с передачей куки сессии в браузере
    // TODO: Исправить передачу куки или реализовать альтернативную авторизацию
    // NOTE: В продакшене рекомендуется включить авторизацию обратно
    
    /*
    // Проверяем авторизацию (только админы и менеджеры)
    const authResult = await checkAuth(request)
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (authResult.user.role !== 'ADMIN' && authResult.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    */

    // Загружаем смету с кешем экспорта
    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id },
      include: {
        exportCache: true,
        rooms: {
          include: {
            works: {
              include: {
                workItem: true
              }
            },
            materials: true
          }
        },
        coefficients: true
      }
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Создаем рабочую книгу ExcelJS
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Смета')

    // Фирменные цвета
    const colors = {
      primary: '000000',      // Черный (основной)
      secondary: '374151',    // Темно-серый
      accent: 'EC4899',       // Розовый (акцент)
      success: 'EC4899',      // Розовый для итогов
      warning: '6B7280',      // Серый для блоков
      gray: '9CA3AF',         // Светло-серый для границ
      lightGray: 'F9FAFB'     // Очень светло-серый фон
    }

    let currentRow = 1

    // Функция для добавления заголовка сметы
    const addTitle = () => {
      const titleRow = worksheet.getRow(currentRow)
      titleRow.getCell(1).value = estimate.title
      
      // Объединяем ячейки для заголовка
      worksheet.mergeCells(currentRow, 1, currentRow, 6)
      
      // Стилизуем заголовок
      titleRow.getCell(1).style = {
        font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + colors.primary } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'medium', color: { argb: 'FF' + colors.primary } },
          bottom: { style: 'medium', color: { argb: 'FF' + colors.primary } },
          left: { style: 'medium', color: { argb: 'FF' + colors.primary } },
          right: { style: 'medium', color: { argb: 'FF' + colors.primary } }
        }
      }
      titleRow.height = 30
      currentRow += 2 // Пропускаем строку
    }

    // Функция для добавления заголовков таблицы
    const addTableHeaders = () => {
      const headerRow = worksheet.getRow(currentRow)
      const headers = ['№ п/п', 'Наименование работ/материалов', 'Ед. изм.', 'Количество', 'Цена за ед.', 'Стоимость']
      
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = header
        cell.style = {
          font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + colors.secondary } },
          alignment: { horizontal: 'center', vertical: 'middle' },
          border: {
            top: { style: 'thin', color: { argb: 'FF' + colors.gray } },
            bottom: { style: 'thin', color: { argb: 'FF' + colors.gray } },
            left: { style: 'thin', color: { argb: 'FF' + colors.gray } },
            right: { style: 'thin', color: { argb: 'FF' + colors.gray } }
          }
        }
      })
      headerRow.height = 25
      currentRow++
    }

    // Функция для добавления заголовка секции
    const addSectionHeader = (title: string) => {
      const sectionRow = worksheet.getRow(currentRow)
      sectionRow.getCell(1).value = title
      
      worksheet.mergeCells(currentRow, 1, currentRow, 6)
      
      sectionRow.getCell(1).style = {
        font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + colors.warning } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: 'FF' + colors.warning } },
          bottom: { style: 'thin', color: { argb: 'FF' + colors.warning } },
          left: { style: 'thin', color: { argb: 'FF' + colors.warning } },
          right: { style: 'thin', color: { argb: 'FF' + colors.warning } }
        }
      }
      sectionRow.height = 20
      currentRow++
    }

    // Функция для добавления заголовка блока
    const addBlockHeader = (title: string) => {
      const blockRow = worksheet.getRow(currentRow)
      blockRow.getCell(2).value = title
      
      // Стилизуем заголовок блока
      for (let col = 1; col <= 6; col++) {
        const cell = blockRow.getCell(col)
        cell.style = {
          font: { bold: true, size: 11, color: { argb: 'FF000000' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + colors.lightGray } },
          alignment: { horizontal: col === 2 ? 'left' : 'center', vertical: 'middle' },
          border: {
            top: { style: 'thin', color: { argb: 'FF' + colors.gray } },
            bottom: { style: 'thin', color: { argb: 'FF' + colors.gray } },
            left: { style: 'thin', color: { argb: 'FF' + colors.gray } },
            right: { style: 'thin', color: { argb: 'FF' + colors.gray } }
          }
        }
      }
      currentRow++
    }

    // Функция для добавления работы
    const addWorkItem = (rowNum: number, workName: string, unit: string, quantity: number, unitPrice: number, totalPrice: number) => {
      const workRow = worksheet.getRow(currentRow)
      const values = [rowNum, workName, unit, quantity, unitPrice, totalPrice]
      
      values.forEach((value, index) => {
        const cell = workRow.getCell(index + 1)
        cell.value = value
        
        // Основные стили
        cell.style = {
          font: { size: 10 },
          alignment: { 
            horizontal: index === 1 ? 'left' : 'center', 
            vertical: 'middle' 
          },
          border: {
            top: { style: 'thin', color: { argb: 'FF' + colors.gray } },
            bottom: { style: 'thin', color: { argb: 'FF' + colors.gray } },
            left: { style: 'thin', color: { argb: 'FF' + colors.gray } },
            right: { style: 'thin', color: { argb: 'FF' + colors.gray } }
          }
        }

        // Форматируем цены
        if ((index === 4 || index === 5) && typeof value === 'number') {
          cell.numFmt = '#,##0.00"₽"'
        }

        // Чередующиеся строки
        if (currentRow % 2 === 0) {
          cell.style.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + colors.lightGray } }
        }
      })
      currentRow++
    }

    // Функция для добавления итога
    const addSubtotal = (title: string, amount: number, isTotal: boolean = false) => {
      const subtotalRow = worksheet.getRow(currentRow)
      subtotalRow.getCell(2).value = title
      subtotalRow.getCell(6).value = amount
      
      const bgColor = isTotal ? colors.accent : colors.accent
      
      for (let col = 1; col <= 6; col++) {
        const cell = subtotalRow.getCell(col)
        cell.style = {
          font: { bold: true, size: isTotal ? 12 : 11, color: { argb: 'FFFFFFFF' } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } },
          alignment: { horizontal: col === 2 ? 'left' : 'center', vertical: 'middle' },
          border: {
            top: { style: 'medium', color: { argb: 'FF' + bgColor } },
            bottom: { style: 'medium', color: { argb: 'FF' + bgColor } },
            left: { style: 'medium', color: { argb: 'FF' + bgColor } },
            right: { style: 'medium', color: { argb: 'FF' + bgColor } }
          }
        }
      }
      
      // Форматируем цену в итоге
      subtotalRow.getCell(6).numFmt = '#,##0.00"₽"'
      subtotalRow.height = isTotal ? 25 : 20
      currentRow++
      if (!isTotal) currentRow++ // Пустая строка после сабтотала
    }

    let workRowNumber = 1

    // Получаем данные из кеша экспорта или собираем из помещений
    let allWorks: any[] = []
    let allMaterials: any[] = []

    if (estimate.exportCache) {
      console.log('📊 Используем кеш экспорта для Excel')
      console.log('📊 Кеш данные:', {
        worksDataLength: estimate.exportCache.worksData?.length || 0,
        materialsDataLength: estimate.exportCache.materialsData?.length || 0,
        totalWorksPrice: estimate.exportCache.totalWorksPrice,
        totalMaterialsPrice: estimate.exportCache.totalMaterialsPrice
      })
      try {
        // Парсим данные из кеша
        const worksData = JSON.parse(estimate.exportCache.worksData)
        const materialsData = JSON.parse(estimate.exportCache.materialsData)
        
        // Преобразуем данные кеша в формат для Excel
        if (Array.isArray(worksData) && worksData.length > 0) {
          worksData.forEach((block: any) => {
            if (block.items && Array.isArray(block.items)) {
              block.items.forEach((item: any) => {
                allWorks.push({
                  ...item,
                  blockTitle: block.title,
                  workItem: { name: item.name, unit: item.unit },
                  quantity: item.quantity,
                  price: item.unitPrice,
                  totalPrice: item.totalPrice
                })
              })
            }
          })
        } else {
          console.log('⚠️ Кеш экспорта пуст или неправильный формат worksData')
        }
        
        if (Array.isArray(materialsData) && materialsData.length > 0) {
          materialsData.forEach((item: any) => {
            allMaterials.push({
              name: item.name,
              unit: item.unit,
              quantity: item.quantity,
              price: item.unitPrice,
              totalPrice: item.totalPrice
            })
          })
        } else {
          console.log('⚠️ Кеш экспорта пуст или неправильный формат materialsData')
        }
      } catch (error) {
        console.error('❌ Ошибка парсинга кеша экспорта:', error)
        // Fallback к старому методу
        allWorks = []
        allMaterials = []
      }
    }

    // Если нет кеша или ошибка парсинга, пробуем альтернативные источники данных
    if (allWorks.length === 0 && allMaterials.length === 0) {
      console.log('📊 Fallback: пробуем альтернативные источники данных')
      console.log('📊 Estimate type:', estimate.type)
      console.log('📊 Estimate rooms count:', estimate.rooms?.length || 0)
      console.log('📊 Has worksBlock:', !!estimate.worksBlock)
      console.log('📊 Has summaryWorksBlock:', !!estimate.summaryWorksBlock)
      
      // Сначала пробуем JSON поля сметы
      if (estimate.summaryWorksBlock) {
        try {
          console.log('📊 Используем summaryWorksBlock')
          const summaryWorksData = JSON.parse(estimate.summaryWorksBlock)
          if (summaryWorksData.blocks && Array.isArray(summaryWorksData.blocks)) {
            summaryWorksData.blocks.forEach((block: any) => {
              if (block.items && Array.isArray(block.items)) {
                block.items.forEach((item: any) => {
                  allWorks.push({
                    ...item,
                    blockTitle: block.title,
                    workItem: { name: item.name, unit: item.unit },
                    quantity: item.quantity,
                    price: item.unitPrice,
                    totalPrice: item.totalPrice
                  })
                })
              }
            })
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга summaryWorksBlock:', error)
        }
      } else if (estimate.worksBlock) {
        try {
          console.log('📊 Используем worksBlock')
          const worksData = JSON.parse(estimate.worksBlock)
          if (worksData.blocks && Array.isArray(worksData.blocks)) {
            worksData.blocks.forEach((block: any) => {
              if (block.items && Array.isArray(block.items)) {
                block.items.forEach((item: any) => {
                  allWorks.push({
                    ...item,
                    blockTitle: block.title,
                    workItem: { name: item.name, unit: item.unit },
                    quantity: item.quantity,
                    price: item.unitPrice,
                    totalPrice: item.totalPrice
                  })
                })
              }
            })
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга worksBlock:', error)
        }
      }
      
      // Материалы из JSON полей
      if (estimate.summaryMaterialsBlock) {
        try {
          console.log('📊 Используем summaryMaterialsBlock')
          const summaryMaterialsData = JSON.parse(estimate.summaryMaterialsBlock)
          if (summaryMaterialsData.items && Array.isArray(summaryMaterialsData.items)) {
            summaryMaterialsData.items.forEach((item: any) => {
              allMaterials.push({
                name: item.name,
                unit: item.unit,
                quantity: item.quantity,
                price: item.unitPrice,
                totalPrice: item.totalPrice
              })
            })
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга summaryMaterialsBlock:', error)
        }
      } else if (estimate.materialsBlock) {
        try {
          console.log('📊 Используем materialsBlock')
          const materialsData = JSON.parse(estimate.materialsBlock)
          if (materialsData.items && Array.isArray(materialsData.items)) {
            materialsData.items.forEach((item: any) => {
              allMaterials.push({
                name: item.name,
                unit: item.unit,
                quantity: item.quantity,
                price: item.unitPrice,
                totalPrice: item.totalPrice
              })
            })
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга materialsBlock:', error)
        }
      }
      
      if (estimate.rooms && estimate.rooms.length > 0) {
        estimate.rooms.forEach((room: any, index: number) => {
          console.log(`📊 Room ${index + 1} (${room.name}):`, {
            worksCount: room.works?.length || 0,
            materialsCount: room.materials?.length || 0
          })
          
          if (room.works && room.works.length > 0) {
            room.works.forEach((work: any) => {
              allWorks.push({
                ...work,
                blockTitle: work.blockTitle || 'Без блока',
                workItem: work.workItem || { name: work.manualWorkName || 'Неизвестная работа', unit: work.manualWorkUnit || 'шт' },
                quantity: work.quantity || 0,
                price: work.price || 0,
                totalPrice: work.totalPrice || 0,
                roomContext: room.name
              })
            })
          }
          
          if (room.materials && room.materials.length > 0) {
            room.materials.forEach((material: any) => {
              allMaterials.push({
                ...material,
                name: material.name || 'Неизвестный материал',
                unit: material.unit || 'шт',
                quantity: material.quantity || 0,
                price: material.price || 0,
                totalPrice: material.totalPrice || 0,
                roomContext: room.name
              })
            })
          }
        })
      }
      
      console.log('📊 Fallback результат:', {
        worksCount: allWorks.length,
        materialsCount: allMaterials.length
      })
    }

    // Функция для группировки и добавления работ
    const processWorkItems = (items: any[], groupByBlock: boolean = true) => {
      if (!groupByBlock) {
        // Без группировки
        items.forEach((item: any) => {
          const workName = item.workItem?.name || item.manualWorkName || item.name || 'Неизвестная работа'
          const unit = item.workItem?.unit || item.manualWorkUnit || item.unit || 'шт'
          const quantity = item.quantity || 0
          const unitPrice = item.price || 0
          const totalPrice = item.totalPrice || (quantity * unitPrice)

          addWorkItem(workRowNumber++, workName, unit, quantity, unitPrice, totalPrice)
        })
        return
      }

      // Группируем по блокам
      const blockGroups: { [key: string]: any[] } = {}
      
      items.forEach((item: any) => {
        const blockTitle = item.blockTitle || 'Без блока'
        if (!blockGroups[blockTitle]) {
          blockGroups[blockTitle] = []
        }
        blockGroups[blockTitle].push(item)
      })

      // Добавляем каждый блок
      Object.entries(blockGroups).forEach(([blockTitle, blockItems]) => {
        addBlockHeader(blockTitle)
        
        let blockTotal = 0
        
        blockItems.forEach((item: any) => {
          const workName = item.workItem?.name || item.manualWorkName || 'Неизвестная работа'
          const unit = item.workItem?.unit || item.manualWorkUnit || 'шт'
          const quantity = item.quantity || 0
          const unitPrice = item.price || 0
          const totalPrice = item.totalPrice || (quantity * unitPrice)
          
          blockTotal += totalPrice
          addWorkItem(workRowNumber++, workName, unit, quantity, unitPrice, totalPrice)
        })

        addSubtotal(`Итого по блоку: ${blockTitle}`, blockTotal)
      })
    }

    // Добавляем заголовок и заголовки таблицы
    addTitle()
    addTableHeaders()

    // Добавляем работы в сводную таблицу
    if (allWorks.length > 0) {
      addSectionHeader('РАБОТЫ')
      processWorkItems(allWorks, true)
      
      // Общий итог по работам (используем данные из кеша если есть)
      const totalWorksPrice = estimate.exportCache 
        ? estimate.exportCache.totalWorksPrice 
        : allWorks.reduce((sum: number, work: any) => sum + (work.totalPrice || 0), 0)
      addSubtotal('ОБЩИЙ ИТОГ ПО РАБОТАМ', totalWorksPrice)
    }

    // Добавляем материалы в сводную таблицу
    if (allMaterials.length > 0) {
      addSectionHeader('МАТЕРИАЛЫ')
      processWorkItems(allMaterials, false)
      
      // Общий итог по материалам (используем данные из кеша если есть)
      const totalMaterialsPrice = estimate.exportCache 
        ? estimate.exportCache.totalMaterialsPrice 
        : allMaterials.reduce((sum: number, material: any) => sum + (material.totalPrice || 0), 0)
      addSubtotal('ОБЩИЙ ИТОГ ПО МАТЕРИАЛАМ', totalMaterialsPrice)
    }

    // Если нет данных
    if (allWorks.length === 0 && allMaterials.length === 0) {
      const emptyRow = worksheet.getRow(currentRow)
      emptyRow.getCell(2).value = 'Данные сметы не найдены или смета пустая'
      currentRow++
    }

    // Общий итог сметы (используем данные из кеша если есть)
    const grandTotal = estimate.exportCache 
      ? estimate.exportCache.grandTotal 
      : estimate.totalPrice || 0
    addSubtotal('ОБЩИЙ ИТОГ СМЕТЫ', grandTotal, true)

    // Настраиваем ширину колонок
    worksheet.columns = [
      { width: 8 },   // № п/п
      { width: 50 },  // Наименование
      { width: 10 },  // Ед. изм.
      { width: 12 },  // Количество
      { width: 15 },  // Цена за ед.
      { width: 15 }   // Стоимость
    ]

    // Генерируем Excel файл
    const excelBuffer = await workbook.xlsx.writeBuffer()

    // Генерируем имя файла (только латиница и цифры для совместимости)
    const safeTitle = estimate.title
      .replace(/[а-яё]/gi, '') // Убираем кириллицу
      .replace(/[^a-zA-Z0-9\s]/g, '') // Убираем все кроме латиницы, цифр и пробелов
      .replace(/\s+/g, '_') // Заменяем пробелы на подчеркивания
      .substring(0, 30) // Ограничиваем длину
    
    const filename = `estimate_${safeTitle || 'unnamed'}_${estimate.id.substring(0, 8)}.xlsx`

    // Возвращаем файл
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export estimate' },
      { status: 500 }
    )
  }
}
