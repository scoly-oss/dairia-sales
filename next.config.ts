import type { NextConfig } from 'next'

const SUPABASE_HOSTNAME = 'noqzwkkdfpbmglewsozo.supabase.co'

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // XSS protection for older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // HSTS — force HTTPS (1 year)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Restrict browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js requires inline scripts and eval in development; restrict in prod
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Allow inline styles (Tailwind uses them) and fonts
      "style-src 'self' 'unsafe-inline'",
      // Allow images from self and data URIs
      "img-src 'self' data: blob:",
      // Allow connections to Supabase
      `connect-src 'self' https://${SUPABASE_HOSTNAME} wss://${SUPABASE_HOSTNAME}`,
      // Fonts from self
      "font-src 'self'",
      // No plugins
      "object-src 'none'",
      // No framing
      "frame-ancestors 'none'",
      // Upgrade insecure requests in production
      'upgrade-insecure-requests',
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
