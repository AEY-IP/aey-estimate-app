import { WorkItem, MaterialItem } from '@/types/estimate'

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split('\n')
  return lines.map(line => {
    // Простой парсер CSV (можно улучшить для обработки кавычек и запятых внутри значений)
    return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
  })
}

export function parseWorksCSV(csvText: string): WorkItem[] {
  const rows = parseCSV(csvText)
  const headers = rows[0]
  
  // Ожидаемые заголовки: name, unit, price, category, description
  const nameIndex = headers.findIndex(h => h.toLowerCase().includes('название') || h.toLowerCase().includes('name'))
  const unitIndex = headers.findIndex(h => h.toLowerCase().includes('единица') || h.toLowerCase().includes('unit'))
  const priceIndex = headers.findIndex(h => h.toLowerCase().includes('цена') || h.toLowerCase().includes('price'))
  const categoryIndex = headers.findIndex(h => h.toLowerCase().includes('категория') || h.toLowerCase().includes('category'))
  const descriptionIndex = headers.findIndex(h => h.toLowerCase().includes('описание') || h.toLowerCase().includes('description'))

  return rows.slice(1).map((row, index) => {
    const price = parseFloat(row[priceIndex]?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
    
    return {
      id: `imported-work-${Date.now()}-${index}`,
      name: row[nameIndex] || '',
      unit: row[unitIndex] || 'шт',
      basePrice: price,
      category: row[categoryIndex] || 'Без категории',
      description: row[descriptionIndex] || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }).filter(work => work.name.length > 0)
}

export function parseMaterialsCSV(csvText: string): MaterialItem[] {
  const rows = parseCSV(csvText)
  const headers = rows[0]
  
  // Ожидаемые заголовки: name, unit, price, category, brand, description
  const nameIndex = headers.findIndex(h => h.toLowerCase().includes('название') || h.toLowerCase().includes('name'))
  const unitIndex = headers.findIndex(h => h.toLowerCase().includes('единица') || h.toLowerCase().includes('unit'))
  const priceIndex = headers.findIndex(h => h.toLowerCase().includes('цена') || h.toLowerCase().includes('price'))
  const categoryIndex = headers.findIndex(h => h.toLowerCase().includes('категория') || h.toLowerCase().includes('category'))
  const brandIndex = headers.findIndex(h => h.toLowerCase().includes('бренд') || h.toLowerCase().includes('brand'))
  const descriptionIndex = headers.findIndex(h => h.toLowerCase().includes('описание') || h.toLowerCase().includes('description'))

  return rows.slice(1).map((row, index) => {
    const price = parseFloat(row[priceIndex]?.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
    
    return {
      id: `imported-material-${Date.now()}-${index}`,
      name: row[nameIndex] || '',
      unit: row[unitIndex] || 'шт',
      basePrice: price,
      category: row[categoryIndex] || 'Без категории',
      brand: row[brandIndex] || '',
      description: row[descriptionIndex] || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }).filter(material => material.name.length > 0)
}

export function generateWorksCSVTemplate(): string {
  const headers = ['Название', 'Единица измерения', 'Цена', 'Категория', 'Описание']
  const exampleRows = [
    ['Демонтаж обоев', 'м²', '150', 'Демонтажные работы', 'Снятие старых обоев с подготовкой поверхности'],
    ['Штукатурка стен', 'м²', '800', 'Отделочные работы', 'Выравнивание стен штукатурной смесью'],
    ['Поклейка обоев', 'м²', '450', 'Отделочные работы', 'Поклейка обоев на подготовленную поверхность'],
  ]
  
  return [headers, ...exampleRows].map(row => row.join(',')).join('\n')
}

export function generateMaterialsCSVTemplate(): string {
  const headers = ['Название', 'Единица измерения', 'Цена', 'Категория', 'Бренд', 'Описание']
  const exampleRows = [
    ['Обои виниловые', 'рулон', '2500', 'Отделочные материалы', 'Erismann', 'Виниловые обои на флизелиновой основе'],
    ['Клей для обоев', 'упак', '450', 'Отделочные материалы', 'Quelyd', 'Универсальный клей для всех типов обоев'],
    ['Ламинат', 'м²', '1200', 'Напольные покрытия', 'Tarkett', 'Ламинат 33 класс, толщина 8мм'],
  ]
  
  return [headers, ...exampleRows].map(row => row.join(',')).join('\n')
}

export function downloadCSVTemplate(type: 'works' | 'materials') {
  const content = type === 'works' ? generateWorksCSVTemplate() : generateMaterialsCSVTemplate()
  const filename = type === 'works' ? 'template_works.csv' : 'template_materials.csv'
  
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
} 