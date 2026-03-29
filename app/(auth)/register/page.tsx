'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: { name: form.name.trim() },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        // Create profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: form.email.trim().toLowerCase(),
          name: form.name.trim(),
          role: 'commercial',
        })
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    border: '1px solid #e5e5e3',
    backgroundColor: '#ffffff',
    color: '#1e2d3d',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#f8f8f6' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
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
            Créez votre compte commercial
          </p>
        </div>

        <div
          className="rounded-[14px] p-8"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e3',
            boxShadow: '0 4px 24px rgba(30,45,61,0.08)',
          }}
        >
          <h1 className="text-xl font-semibold mb-6" style={{ color: '#1e2d3d' }}>
            Inscription
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
            {[
              { id: 'name', label: 'Nom complet', type: 'text', placeholder: 'Marie Dupont' },
              { id: 'email', label: 'Email', type: 'email', placeholder: 'marie@cabinet.fr' },
              { id: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••' },
              { id: 'confirm', label: 'Confirmer le mot de passe', type: 'password', placeholder: '••••••••' },
            ].map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#1e2d3d' }}
                >
                  {field.label}
                </label>
                <input
                  id={field.id}
                  name={field.id}
                  type={field.type}
                  required
                  value={form[field.id as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
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
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white mt-2"
              style={{ backgroundColor: '#e8842c', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: '#6b7280' }}>
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium" style={{ color: '#e8842c' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
