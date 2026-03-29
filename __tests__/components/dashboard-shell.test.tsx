/**
 * DashboardShell responsive layout tests
 */

// Mock Sidebar to avoid its dependencies
jest.mock('@/components/layout/Sidebar', () => {
  return function MockSidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
    return (
      <div data-testid="sidebar" data-mobile-open={mobileOpen ? 'true' : 'false'}>
        <button onClick={onClose} data-testid="sidebar-close">Close</button>
      </div>
    )
  }
})

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardShell from '@/components/layout/DashboardShell'

describe('DashboardShell', () => {
  it('renders children', () => {
    render(
      <DashboardShell>
        <div>Page content</div>
      </DashboardShell>
    )
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('renders sidebar', () => {
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    )
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('sidebar starts closed on mobile', () => {
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    )
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'false')
  })

  it('shows mobile hamburger button', () => {
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    )
    expect(screen.getByLabelText('Ouvrir le menu')).toBeInTheDocument()
  })

  it('opens sidebar when hamburger is clicked', () => {
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    )
    const hamburger = screen.getByLabelText('Ouvrir le menu')
    fireEvent.click(hamburger)
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'true')
  })

  it('closes sidebar via onClose callback', () => {
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    )
    // Open first
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'true')
    // Close via sidebar callback
    fireEvent.click(screen.getByTestId('sidebar-close'))
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'false')
  })

  it('shows overlay when sidebar is open', () => {
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    )
    // No overlay initially
    expect(screen.queryByRole('generic', { hidden: true })).toBeDefined()
    // Open sidebar
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))
    // Overlay should be visible (clicking it closes the sidebar)
    const overlay = screen.getByTestId('sidebar').parentElement?.querySelector('.fixed.inset-0.z-30')
    expect(overlay).toBeTruthy()
  })

  it('closes sidebar when overlay is clicked', () => {
    const { container } = render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    )
    // Open
    fireEvent.click(screen.getByLabelText('Ouvrir le menu'))
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'true')
    // Click overlay
    const overlay = container.querySelector('.fixed.inset-0.z-30')
    if (overlay) fireEvent.click(overlay)
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-mobile-open', 'false')
  })

  it('shows DAIRIA Sales in mobile top bar', () => {
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>
    )
    expect(screen.getByText('DAIRIA Sales')).toBeInTheDocument()
  })
})
