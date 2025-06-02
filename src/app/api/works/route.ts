import { NextRequest, NextResponse } from 'next/server'
import { loadWorks, saveWorks, addWork, searchWorks, getCategories } from '@/lib/data-manager'

// GET /api/works - получение всех работ или поиск
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const getOnlyCategories = searchParams.get('categories') === 'true'
    
    if (getOnlyCategories) {
      const categories = await getCategories()
      return NextResponse.json({ categories })
    }
    
    const works = await searchWorks(query, category)
    return NextResponse.json({ works, total: works.length })
  } catch (error) {
    console.error('Ошибка получения работ:', error)
    return NextResponse.json({ error: 'Ошибка получения данных' }, { status: 500 })
  }
}

// POST /api/works - добавление новой работы
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, unit, basePrice, category, description } = body
    
    if (!name || !unit || basePrice === undefined) {
      return NextResponse.json({ error: 'Отсутствуют обязательные поля' }, { status: 400 })
    }
    
    const newWork = await addWork({
      name,
      unit,
      basePrice: Number(basePrice),
      category: category || 'Без категории',
      description: description || '',
      isActive: true,
    })
    
    if (!newWork) {
      return NextResponse.json({ error: 'Ошибка создания работы' }, { status: 500 })
    }
    
    return NextResponse.json({ work: newWork }, { status: 201 })
  } catch (error) {
    console.error('Ошибка создания работы:', error)
    return NextResponse.json({ error: 'Ошибка создания работы' }, { status: 500 })
  }
} 