import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { WorkParameterLink } from '@/types/estimate'

const dataPath = join(process.cwd(), 'data', 'work-parameter-links.json')

function readLinksData() {
  try {
    if (!existsSync(dataPath)) {
      return { links: [] }
    }
    const data = readFileSync(dataPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Ошибка чтения файла связей:', error)
    return { links: [] }
  }
}

function writeLinksData(data: any) {
  try {
    writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Ошибка записи файла связей:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const data = readLinksData()
    return NextResponse.json({ links: data.links })
  } catch (error) {
    console.error('Ошибка получения связей:', error)
    return NextResponse.json(
      { error: 'Ошибка получения связей' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workId, parameterId, multiplier, description } = body
    
    if (!workId || !parameterId || multiplier === undefined) {
      return NextResponse.json(
        { error: 'Обязательные поля: workId, parameterId, multiplier' },
        { status: 400 }
      )
    }
    
    const data = readLinksData()
    
    // Проверяем, нет ли уже такой связи
    const existingLink = data.links.find((link: any) => 
      link.workId === workId && link.parameterId === parameterId
    )
    
    if (existingLink) {
      return NextResponse.json(
        { error: 'Связь между этой работой и параметром уже существует' },
        { status: 400 }
      )
    }
    
    const newLink: WorkParameterLink = {
      id: `link_${Date.now()}`,
      workId,
      parameterId,
      multiplier: Number(multiplier),
      description: description || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    data.links.push(newLink)
    
    if (writeLinksData(data)) {
      return NextResponse.json({ link: newLink })
    } else {
      return NextResponse.json(
        { error: 'Ошибка сохранения связи' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка создания связи:', error)
    return NextResponse.json(
      { error: 'Ошибка создания связи' },
      { status: 500 }
    )
  }
} 