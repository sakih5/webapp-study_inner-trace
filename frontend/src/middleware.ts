import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (USE_MOCK) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/log', req.url));
    }
    return NextResponse.next();
  }

  // Supabase Auth によるルートガード
  const res = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // 未ログインで保護対象ページにアクセス → /login へリダイレクト
  if (!session && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // ログイン済みで /login にアクセス → /log へリダイレクト
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/log', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
