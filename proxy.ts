import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy function — remplace middleware.ts.
 * Conforme aux directives CLAUDE.md : utiliser proxy.ts avec export function proxy().
 */
export function proxy(request: NextRequest): NextResponse | null {
  return null
}
