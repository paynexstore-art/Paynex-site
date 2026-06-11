// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // حماية لوحة المدير
  if (path.startsWith('/secure-dashboard')) {
    const customAuth = req.cookies.get('paynex_custom_auth')?.value;
    
    if (!session && !customAuth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (session) {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (user?.role !== 'super_admin' && user?.role !== 'admin') {
        if (!customAuth) {
          return NextResponse.redirect(new URL('/', req.url))
        }
      }
    }
  }

  // حماية لوحة المشرف
  if (path.startsWith('/supervisor')) {
    const customAuth = req.cookies.get('paynex_custom_auth')?.value;

    if (!session && !customAuth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (session) {
      const { data: user } = await supabase
        .from('users')
        .select('role, is_locked')
        .eq('id', session.user.id)
        .single()
      if (user?.role !== 'supervisor') {
        if (!customAuth) {
          return NextResponse.redirect(new URL('/', req.url))
        }
      }
      if (user?.is_locked) {
        if (path !== '/supervisor/locked') {
          return NextResponse.redirect(new URL('/supervisor/locked', req.url))
        }
      }
    }
  }

  return res
}

export const config = {
  matcher: ['/secure-dashboard/:path*', '/supervisor/:path*', '/api/:path*'],
}
