import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { Estimate, Client } from '@/types/estimate'

const dataPath = join(process.cwd(), 'data', 'estimates.json')

function readEstimatesData() {
  try {
    if (!existsSync(dataPath)) {
      return { estimates: [] }
    }
    const data = readFileSync(dataPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Ошибка чтения файла смет:', error)
    return { estimates: [] }
  }
}

function writeEstimatesData(data: any) {
  try {
    writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('Ошибка записи файла смет:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const data = readEstimatesData()
    return NextResponse.json({ estimates: data.estimates })
  } catch (error) {
    console.error('Ошибка получения смет:', error)
    return NextResponse.json(
      { error: 'Ошибка получения смет' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type = 'apartment', client, coefficients = [] } = body
    
    if (!title || !client?.name || !client?.phone) {
      return NextResponse.json(
        { error: 'Обязательные поля: title, client.name, client.phone' },
        { status: 400 }
      )
    }
    
    const data = readEstimatesData()
    
    const baseEstimate = {
      id: `estimate_${Date.now()}`,
      title,
      type,
      client: {
        id: `client_${Date.now()}`,
        name: client.name,
        phone: client.phone,
        email: client.email || '',
        address: client.address || '',
        createdAt: new Date()
      },
      totalWorksPrice: 0,
      totalMaterialsPrice: 0,
      totalPrice: 0,
      status: 'draft' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: '',
      coefficients: coefficients
    }
    
    let newEstimate: Estimate
    
    if (type === 'apartment') {
      // Классическая смета для всей квартиры
      newEstimate = {
        ...baseEstimate,
        worksBlock: {
          id: `works_${Date.now()}`,
          title: 'Работы',
          blocks: [],
          totalPrice: 0
        },
        materialsBlock: {
          id: `materials_${Date.now()}`,
          title: 'Материалы',
          items: [],
          totalPrice: 0
        }
      }
    } else {
      // Смета по помещениям
      newEstimate = {
        ...baseEstimate,
        rooms: [], // Пустой массив помещений - будем добавлять через UI
        summaryWorksBlock: {
          id: `summary_works_${Date.now()}`,
          title: 'Сводная смета - Работы',
          blocks: [],
          totalPrice: 0
        },
        summaryMaterialsBlock: {
          id: `summary_materials_${Date.now()}`,
          title: 'Сводная смета - Материалы',
          items: [],
          totalPrice: 0
        }
      }
    }
    
    data.estimates.push(newEstimate)
    
    if (writeEstimatesData(data)) {
      return NextResponse.json({ estimate: newEstimate })
    } else {
      return NextResponse.json(
        { error: 'Ошибка сохранения сметы' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка создания сметы:', error)
    return NextResponse.json(
      { error: 'Ошибка создания сметы' },
      { status: 500 }
    )
  }
} 