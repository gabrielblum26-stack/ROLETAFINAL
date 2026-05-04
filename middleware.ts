import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // O middleware do Next.js não tem acesso ao localStorage.
  // Vamos deixar o controle de rotas para o lado do cliente (React)
  // para evitar loops de redirecionamento.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
