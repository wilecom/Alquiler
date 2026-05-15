import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const esRutaPublica =
    pathname.startsWith('/auth') ||
    pathname === '/registro' ||
    pathname.startsWith('/solicitud')

  // Si está autenticado y en ruta pública, redirigir al dashboard según rol
  if (user && esRutaPublica) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('user_id', user.id)
      .single()
    if (perfil?.rol === 'conductor') {
      return NextResponse.redirect(new URL('/conductor/dashboard', request.url))
    }
    if (perfil?.rol === 'equipo') {
      return NextResponse.redirect(new URL('/equipo/dashboard', request.url))
    }
  }

  // Rutas públicas (sin sesión)
  if (esRutaPublica) {
    return supabaseResponse
  }

  // Sin sesión → login
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Obtener rol del usuario
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('user_id', user.id)
    .single()

  const rol = perfil?.rol

  // Conductor intentando acceder a rutas de equipo
  if (rol === 'conductor' && pathname.startsWith('/equipo')) {
    return NextResponse.redirect(new URL('/conductor/dashboard', request.url))
  }

  // Equipo intentando acceder a rutas de conductor
  if (rol === 'equipo' && pathname.startsWith('/conductor')) {
    return NextResponse.redirect(new URL('/equipo/dashboard', request.url))
  }

  // Redirigir raíz según rol
  if (pathname === '/') {
    if (rol === 'conductor') {
      return NextResponse.redirect(new URL('/conductor/dashboard', request.url))
    }
    if (rol === 'equipo') {
      return NextResponse.redirect(new URL('/equipo/dashboard', request.url))
    }
  }

  return supabaseResponse
}
