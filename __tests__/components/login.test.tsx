/**
 * Auth page tests
 */

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'test-id' } }, error: null }),
    },
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginPage from '@/app/(auth)/login/page'
import RegisterPage from '@/app/(auth)/register/page'

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />)
    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('shows DAIRIA branding', () => {
    render(<LoginPage />)
    expect(screen.getByText('DAIRIA Sales')).toBeInTheDocument()
  })

  it('shows error for wrong credentials', async () => {
    const { createClient } = require('@/lib/supabase/client')
    createClient.mockReturnValueOnce({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({ error: { message: 'Invalid credentials' } }),
      },
    })

    render(<LoginPage />)
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Mot de passe')
    const submitBtn = screen.getByRole('button', { name: 'Se connecter' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Email ou mot de passe incorrect.')).toBeInTheDocument()
    })
  })

  it('has link to register page', () => {
    render(<LoginPage />)
    const link = screen.getByRole('link', { name: 'Créer un compte' })
    expect(link).toHaveAttribute('href', '/register')
  })
})

describe('RegisterPage', () => {
  it('renders registration form', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Inscription')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom complet')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('shows password mismatch error', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'password456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    await waitFor(() => {
      expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument()
    })
  })

  it('shows short password error', async () => {
    render(<RegisterPage />)

    fireEvent.change(screen.getByLabelText('Nom complet'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'pass' } })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    await waitFor(() => {
      expect(screen.getByText('Le mot de passe doit contenir au moins 8 caractères.')).toBeInTheDocument()
    })
  })

  it('has link to login page', () => {
    render(<RegisterPage />)
    const link = screen.getByRole('link', { name: 'Se connecter' })
    expect(link).toHaveAttribute('href', '/login')
  })
})
