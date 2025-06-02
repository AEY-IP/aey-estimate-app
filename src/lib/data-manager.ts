import { WorkItem } from '@/types/estimate'
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'works.json')

interface WorksData {
  works: WorkItem[]
  metadata: {
    totalCount: number
    lastUpdated: string
    version: string
  }
}

// Загрузка данных из JSON файла
export async function loadWorks(): Promise<WorkItem[]> {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return []
    }
    
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8')
    const data: WorksData = JSON.parse(fileContent)
    return data.works || []
  } catch (error) {
    console.error('Ошибка загрузки данных работ:', error)
    return []
  }
}

// Сохранение данных в JSON файл
export async function saveWorks(works: WorkItem[]): Promise<boolean> {
  try {
    const data: WorksData = {
      works,
      metadata: {
        totalCount: works.length,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('Ошибка сохранения данных работ:', error)
    return false
  }
}

// Добавление новой работы
export async function addWork(work: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkItem | null> {
  try {
    const works = await loadWorks()
    
    const newWork: WorkItem = {
      ...work,
      id: `work-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    works.push(newWork)
    const saved = await saveWorks(works)
    
    return saved ? newWork : null
  } catch (error) {
    console.error('Ошибка добавления работы:', error)
    return null
  }
}

// Обновление работы
export async function updateWork(id: string, updates: Partial<WorkItem>): Promise<WorkItem | null> {
  try {
    const works = await loadWorks()
    const index = works.findIndex(work => work.id === id)
    
    if (index === -1) {
      return null
    }
    
    works[index] = {
      ...works[index],
      ...updates,
      updatedAt: new Date(),
    }
    
    const saved = await saveWorks(works)
    return saved ? works[index] : null
  } catch (error) {
    console.error('Ошибка обновления работы:', error)
    return null
  }
}

// Удаление работы
export async function deleteWork(id: string): Promise<boolean> {
  try {
    const works = await loadWorks()
    const filteredWorks = works.filter(work => work.id !== id)
    
    if (filteredWorks.length === works.length) {
      return false // Работа не найдена
    }
    
    return await saveWorks(filteredWorks)
  } catch (error) {
    console.error('Ошибка удаления работы:', error)
    return false
  }
}

// Поиск работ
export async function searchWorks(query: string, category?: string): Promise<WorkItem[]> {
  try {
    const works = await loadWorks()
    
    return works.filter(work => {
      const matchesQuery = !query || 
        work.name.toLowerCase().includes(query.toLowerCase()) ||
        work.description?.toLowerCase().includes(query.toLowerCase())
      
      const matchesCategory = !category || category === 'Все категории' || work.category === category
      
      return matchesQuery && matchesCategory
    })
  } catch (error) {
    console.error('Ошибка поиска работ:', error)
    return []
  }
}

// Получение всех категорий
export async function getCategories(): Promise<string[]> {
  try {
    const works = await loadWorks()
    const categories = new Set(works.map(work => work.category))
    return ['Все категории', ...Array.from(categories).sort()]
  } catch (error) {
    console.error('Ошибка получения категорий:', error)
    return ['Все категории']
  }
}

// Импорт работ из CSV
export async function importWorksFromCSV(csvContent: string): Promise<{ success: boolean, count: number, errors: string[] }> {
  try {
    const lines = csvContent.trim().split('\n')
    const headers = lines[0].split(',')
    const dataLines = lines.slice(1)
    
    const errors: string[] = []
    const newWorks: WorkItem[] = []
    
    dataLines.forEach((line: string, index: number) => {
      try {
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''))
        const [idAey, idPrimary, category, name, unit, price] = columns
        
        if (!name || name.length === 0) {
          errors.push(`Строка ${index + 2}: отсутствует название работы`)
          return
        }
        
        // Попытка парсинга цены
        let parsedPrice = 0
        let priceNote = ''
        
        if (price && price.length > 0) {
          const numericPrice = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
          
          if (!isNaN(numericPrice) && numericPrice > 0) {
            parsedPrice = numericPrice
          } else {
            // Если цена не числовая, сохраняем оригинальный текст в описании
            priceNote = `Цена: ${price}`
            parsedPrice = 0
          }
        }
        
        let description = ''
        if (idAey || idPrimary) {
          description = `Импортировано из CSV. ID_AEY: ${idAey || 'не указан'}, ID_PRIMARY: ${idPrimary || 'не указан'}`
        }
        if (priceNote) {
          description += description ? `. ${priceNote}` : priceNote
        }
        
        const work: WorkItem = {
          id: `imported-${Date.now()}-${index}`,
          name: name.trim(),
          unit: unit?.trim() || 'шт',
          basePrice: parsedPrice,
          category: category?.trim() || 'Импортированные',
          description,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        newWorks.push(work)
      } catch (error) {
        errors.push(`Строка ${index + 2}: ошибка парсинга - ${error}`)
      }
    })
    
    if (newWorks.length > 0) {
      const existingWorks = await loadWorks()
      const allWorks = [...existingWorks, ...newWorks]
      await saveWorks(allWorks)
    }
    
    return {
      success: newWorks.length > 0,
      count: newWorks.length,
      errors
    }
  } catch (error) {
    return {
      success: false,
      count: 0,
      errors: [`Общая ошибка импорта: ${error}`]
    }
  }
}

// Импорт работ из файла справочника (формат ID_AEY,ID_PRIMARY,CLASS,KIND,MES,PRICE)
export async function importWorksFromReferenceCSV(csvFilePath: string): Promise<{ success: boolean, imported: number, skipped: number, errors: string[] }> {
  try {
    const fs = require('fs')
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    const lines = csvContent.trim().split('\n')
    
    // Пропускаем заголовок
    const dataLines = lines.slice(1)
    
    const errors: string[] = []
    const newWorks: WorkItem[] = []
    const existingWorks = await loadWorks()
    
    // Создаем множество существующих работ для быстрого поиска
    const existingWorksSet = new Set(existingWorks.map(work => 
      `${work.name.toLowerCase()}_${work.category.toLowerCase()}`
    ))
    
    let skipped = 0
    
    dataLines.forEach((line: string, index: number) => {
      try {
        const columns = line.split(',')
        
        if (columns.length < 6) {
          errors.push(`Строка ${index + 2}: недостаточно колонок`)
          return
        }
        
        const idAey = columns[0]?.trim()
        const idPrimary = columns[1]?.trim()
        const category = columns[2]?.trim()
        const name = columns[3]?.trim()
        const unit = columns[4]?.trim()
        const priceStr = columns[5]?.trim()
        
        if (!name || name.length === 0) {
          errors.push(`Строка ${index + 2}: отсутствует название работы`)
          return
        }
        
        // Проверяем, существует ли уже такая работа
        const workKey = `${name.toLowerCase()}_${category.toLowerCase()}`
        if (existingWorksSet.has(workKey)) {
          skipped++
          return
        }
        
        // Попытка парсинга цены
        let parsedPrice = 0
        let priceNote = ''
        
        if (priceStr && priceStr.length > 0) {
          const numericPrice = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.'))
          
          if (!isNaN(numericPrice) && numericPrice > 0) {
            parsedPrice = numericPrice
          } else {
            // Если цена не числовая, сохраняем оригинальный текст в описании
            priceNote = `Цена: ${priceStr}`
            parsedPrice = 0
          }
        }
        
        let description = `Импортировано из справочника. ID_AEY: ${idAey}, ID_PRIMARY: ${idPrimary}`
        if (priceNote) {
          description += `. ${priceNote}`
        }
        
        const work: WorkItem = {
          id: `ref-${idAey}-${Date.now()}-${index}`,
          name: name,
          unit: unit || 'шт',
          basePrice: parsedPrice,
          category: category || 'Импортированные',
          description,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        newWorks.push(work)
        
      } catch (error) {
        errors.push(`Строка ${index + 2}: ошибка парсинга - ${error}`)
      }
    })
    
    if (newWorks.length > 0) {
      const allWorks = [...existingWorks, ...newWorks]
      await saveWorks(allWorks)
    }
    
    return {
      success: true,
      imported: newWorks.length,
      skipped,
      errors
    }
  } catch (error) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [`Общая ошибка импорта: ${error}`]
    }
  }
} 