import { NextRequest, NextResponse } from 'next/server'
import { importWorksFromCSV } from '@/lib/data-manager'

// POST /api/works/import - импорт работ из CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csvContent } = body
    
    if (!csvContent) {
      return NextResponse.json({ error: 'Отсутствует содержимое CSV' }, { status: 400 })
    }
    
    const result = await importWorksFromCSV(csvContent)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        count: result.count,
        errors: result.errors
      })
    } else {
      return NextResponse.json({
        error: 'Ошибка импорта',
        details: result.errors
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Ошибка импорта CSV:', error)
    return NextResponse.json({ error: 'Ошибка сервера при импорте' }, { status: 500 })
  }
} 