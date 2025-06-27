import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  try {
    // Créer une nouvelle réponse
    const res = NextResponse.next();

    // Créer le client Supabase avec la requête et la réponse
    const supabase = createMiddlewareClient({ req, res });

    // Rafraîchir la session si nécessaire
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    // Pour les routes API qui nécessitent une authentification
    if (req.nextUrl.pathname.startsWith('/api/')) {
      if (sessionError) {
        console.error('API route session error:', sessionError);
        return NextResponse.json(
          { error: 'Authentication error', details: sessionError.message },
          { status: 401 }
        );
      }

      if (!session) {
        console.error('API route - No session found');
        return NextResponse.json(
          { error: 'No valid session found' },
          { status: 401 }
        );
      }

      // Ajouter le user ID et le token aux headers pour les routes API
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', session.user.id);
      requestHeaders.set('x-user-email', session.user.email || '');
      requestHeaders.set('x-auth-token', session.access_token);

      // Créer une nouvelle réponse avec les headers modifiés
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

      // Copier les cookies de la réponse Supabase
      const supabaseCookies = res.headers.getSetCookie();
      supabaseCookies.forEach(cookie => {
        response.headers.append('Set-Cookie', cookie);
      });

      return response;
    }

    // Pour les routes non-API, on retourne simplement la réponse avec les cookies mis à jour
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// S'applique à toutes les routes sauf les ressources statiques
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|pokemon/.*\\.png|.*\\.svg).*)',
    '/api/:path*'
  ],
}; 