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
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
    if (user?.role !== 'super_admin' && user?.role !== 'admin') {
      // Fallback: allow if custom auth cookie is set (from login page)
      const customAuth = req.cookies.get('paynex_custom_auth')?.value;
      if (!customAuth) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
  }

  // حماية لوحة المشرف
  if (path.startsWith('/supervisor')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    const { data: user } = await supabase
      .from('users')
      .select('role, is_locked')
      .eq('id', session.user.id)
      .single()
    if (user?.role !== 'supervisor') {
      const customAuth = req.cookies.get('paynex_custom_auth')?.value;
      if (!customAuth) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
    if (user?.is_locked) {
      // Allow access to locked page specifically if needed, or redirect
      if (path !== '/supervisor/locked') {
        return NextResponse.redirect(new URL('/supervisor/locked', req.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: ['/secure-dashboard/:path*', '/supervisor/:path*', '/api/:path*'],
}
