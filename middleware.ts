import { NextRequest, NextResponse } from 'next/server'

// Публичные страницы, доступные без авторизации
const publicPaths = ['/login', '/client-login', '/']

// Админские страницы, доступные только админам
const adminPaths = ['/admin', '/works', '/coefficients', '/room-parameters']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Разрешаем доступ к публичным страницам
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Разрешаем доступ к API публичной аутентификации
  if (pathname.startsWith('/api/auth/login') || 
      pathname.startsWith('/api/auth/client-login') ||
      pathname.startsWith('/api/auth/client-logout') ||
      pathname.startsWith('/api/auth/client-me') ||
      pathname.startsWith('/api/auth/me') ||
      pathname.startsWith('/api/auth/logout')) {
    return NextResponse.next()
  }
  
  // Обрабатываем клиентские страницы отдельно
  if (pathname.startsWith('/client-dashboard') || pathname.startsWith('/api/client')) {
    const clientToken = request.cookies.get('client-token')
    
    if (!clientToken || !clientToken.value) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    return NextResponse.next()
  }
  
  // Проверяем наличие сессии для обычных страниц
  const authSession = request.cookies.get('auth-session')
  
  if (!authSession || !authSession.value) {
    // Нет сессии - перенаправляем на главную страницу
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  try {
    const session = JSON.parse(authSession.value)
    const userRole = session.role
    
    // Проверяем доступ к админским страницам
    if (adminPaths.some(path => pathname.startsWith(path))) {
      if (userRole !== 'ADMIN') {
        // Менеджер пытается зайти в админку - перенаправляем на главную
        return NextResponse.redirect(new URL('/dashboard', request.url))
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
      
      // API шаблонов: просмотр и применение для ADMIN/MANAGER, создание/редактирование только для ADMIN
      if (pathname.startsWith('/api/templates')) {
        // Просмотр шаблонов доступен ADMIN и MANAGER
        if (request.method === 'GET' || pathname.includes('/apply')) {
          if (!['ADMIN', 'MANAGER'].includes(userRole)) {
            return NextResponse.json(
              { error: 'Доступ запрещен. Требуются права администратора или менеджера.' },
              { status: 403 }
            )
          }
        }
        
        // Создание, редактирование, удаление только для ADMIN
        if (['POST', 'PUT', 'DELETE'].includes(request.method) && !pathname.includes('/apply')) {
          if (userRole !== 'ADMIN') {
            return NextResponse.json(
              { error: 'Доступ запрещен. Требуются права администратора.' },
              { status: 403 }
            )
          }
        }
      }
    }
    
    // Проверяем доступ к страницам шаблонов
    if (pathname.startsWith('/templates')) {
      if (!['ADMIN', 'MANAGER'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    
    return NextResponse.next()
    
  } catch (error) {
    console.error('Ошибка парсинга сессии:', error)
    // Неверная сессия - удаляем cookie и перенаправляем на главную страницу
    const response = NextResponse.redirect(new URL('/', request.url))
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
     * - /_next/webpack-hmr (горячая перезагрузка)
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico).*)',
  ],
} 