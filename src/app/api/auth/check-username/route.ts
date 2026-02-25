import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false })
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    return NextResponse.json({ 
      available: !existingUser,
      message: existingUser ? 'Логин уже занят' : 'Логин доступен'
    })
  } catch (error) {
    console.error('Error checking username:', error)
    return NextResponse.json({ available: false }, { status: 500 })
  }
}
