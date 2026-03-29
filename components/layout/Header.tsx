'use client'

import { useState } from 'react'
import { Bell, Search, Menu } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types'
import { useSidebar } from './SidebarContext'

interface HeaderProps {
  profile: Profile | null
  title: string
}

export default function Header({ profile, title }: HeaderProps) {
  const [search, setSearch] = useState('')
  const { toggle } = useSidebar()

  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 z-20"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e5e3',
        minHeight: '65px',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="lg:hidden p-2 rounded-xl transition-colors"
          style={{ color: '#6b7280', backgroundColor: '#f8f8f6' }}
        >
          <Menu size={18} />
        </button>

        <h1 className="text-base sm:text-lg font-semibold" style={{ color: '#1e2d3d' }}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#6b7280' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 text-sm rounded-xl outline-none w-44 lg:w-52 transition-all"
            style={{
              backgroundColor: '#f8f8f6',
              border: '1px solid #e5e5e3',
              color: '#1e2d3d',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#e8842c'
              e.target.style.boxShadow = '0 0 0 3px rgba(232,132,44,0.08)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e5e3'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ backgroundColor: '#f8f8f6' }}
        >
          <Bell size={16} style={{ color: '#6b7280' }} />
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-semibold cursor-pointer flex-shrink-0"
          style={{ backgroundColor: '#e8842c' }}
          title={profile?.name || profile?.email || ''}
        >
          {getInitials(profile?.name || profile?.email || '')}
        </div>
      </div>
    </header>
  )
}
