import { NextRequest, NextResponse } from 'next/server'

// Публичные страницы, доступные без авторизации
const publicPaths = ['/login']

// Админские страницы, доступные только админам
const adminPaths = ['/admin', '/works', '/coefficients', '/room-parameters']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Разрешаем доступ к публичным страницам
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Разрешаем доступ к API публичной аутентификации
  if (pathname.startsWith('/api/auth/login')) {
    return NextResponse.next()
  }
  
  // Проверяем наличие сессии
  const authSession = request.cookies.get('auth-session')
  
  if (!authSession || !authSession.value) {
    // Нет сессии - перенаправляем на вход
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  try {
    const session = JSON.parse(authSession.value)
    const userRole = session.role
    
    // Проверяем доступ к админским страницам
    if (adminPaths.some(path => pathname.startsWith(path))) {
      if (userRole !== 'ADMIN') {
        // Менеджер пытается зайти в админку - перенаправляем на главную
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    
    // Проверяем доступ к API админских функций
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/logout')) {
      // Для API проверяем роли более детально
      if (pathname.startsWith('/api/works') || 
          pathname.startsWith('/api/coefficients') || 
          pathname.startsWith('/api/room-parameters')) {
        
        // GET запросы доступны всем авторизованным
        if (request.method === 'GET') {
          return NextResponse.next()
        }
        
        // POST, PUT, DELETE только админам
        if (userRole !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Доступ запрещен. Требуются права администратора.' },
            { status: 403 }
          )
        }
      }
    }
    
    return NextResponse.next()
    
  } catch (error) {
    console.error('Ошибка парсинга сессии:', error)
    // Неверная сессия - удаляем cookie и перенаправляем на вход
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-session')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Применяем middleware ко всем страницам кроме:
     * - /api/auth/login (публичный API)
     * - /_next/static (статические файлы)
     * - /_next/image (оптимизация изображений)
     * - /favicon.ico (фавикон)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 