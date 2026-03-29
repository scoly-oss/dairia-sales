import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

// Validate redirect path to prevent open redirect attacks
function isSafeRedirectPath(path: string): boolean {
  // Must start with / and not with // (which would be protocol-relative URL)
  if (!path.startsWith('/') || path.startsWith('//')) return false
  // No protocol schemes allowed
  if (/^\/[a-z][a-z0-9+\-.]*:/i.test(path)) return false
  return true
}

export async function GET(request: NextRequest) {
  // Rate limit: 20 auth callback attempts per IP per 15 minutes
  const ip = getClientIp(request.headers)
  const limit = rateLimit(`auth:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 })
  if (!limit.success) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  // Prevent open redirect: only allow relative paths
  const next = isSafeRedirectPath(rawNext) ? rawNext : '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
