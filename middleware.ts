import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Este middleware roda no lado do servidor
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Permitir acesso a arquivos estáticos e APIs públicas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Rotas públicas (Login e Registro)
  const isPublicRoute = pathname === '/login' || pathname === '/register';

  // Como o token está no localStorage (client-side), o middleware do Next.js 
  // não consegue ler diretamente. No entanto, podemos usar um cookie para 
  // espelhar o estado de autenticação se quisermos proteção via middleware.
  
  // Por enquanto, vamos garantir que a rota raiz (/) redirecione para /login
  // e as proteções client-side farão o resto.
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
