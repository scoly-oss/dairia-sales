'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        setError('Email ou mot de passe incorrect.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#f8f8f6' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-3 mb-4"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: '#e8842c' }}
            >
              D
            </div>
            <span className="text-2xl font-bold" style={{ color: '#1e2d3d' }}>
              DAIRIA Sales
            </span>
          </div>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            CRM commercial DAIRIA Avocats
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-sm"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
        >
          <h1
            className="text-xl font-semibold mb-6"
            style={{ color: '#1e2d3d' }}
          >
            Connexion
          </h1>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#1e2d3d' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@cabinet.fr"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: '1px solid #e5e5e3',
                  backgroundColor: '#ffffff',
                  color: '#1e2d3d',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#e8842c'
                  e.target.style.boxShadow = '0 0 0 3px rgba(232,132,44,0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e5e3'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#1e2d3d' }}
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  border: '1px solid #e5e5e3',
                  backgroundColor: '#ffffff',
                  color: '#1e2d3d',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#e8842c'
                  e.target.style.boxShadow = '0 0 0 3px rgba(232,132,44,0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e5e3'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity mt-2"
              style={{ backgroundColor: '#e8842c', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: '#6b7280' }}>
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="font-medium"
              style={{ color: '#e8842c' }}
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
