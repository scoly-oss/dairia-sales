'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

interface DashboardShellProps {
  children: React.ReactNode
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f8f8f6' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 md:ml-60 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 md:hidden sticky top-0 z-20"
          style={{ backgroundColor: '#1e2d3d' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white flex-shrink-0"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: '#e8842c' }}
          >
            D
          </div>
          <span className="text-white font-semibold text-sm">DAIRIA Sales</span>
        </div>

        {children}
      </main>
    </div>
  )
}
