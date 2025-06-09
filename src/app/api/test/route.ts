import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  console.log('TEST API: GET request received')
  return NextResponse.json({ status: 'OK', message: 'API работает' })
}

export async function POST(request: NextRequest) {
  console.log('TEST API: POST request received')
  try {
    const body = await request.json()
    console.log('TEST API: Request body:', body)
    return NextResponse.json({ status: 'OK', received: body })
  } catch (error) {
    console.log('TEST API: Error:', error)
    return NextResponse.json({ error: 'Ошибка парсинга' }, { status: 500 })
  }
} 