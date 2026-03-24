'use client'

import { useState } from 'react'
import { Bell, Search } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/lib/types'

interface HeaderProps {
  profile: Profile | null
  title: string
}

export default function Header({ profile, title }: HeaderProps) {
  const [search, setSearch] = useState('')

  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e5e3',
        height: '65px',
      }}
    >
      <h1 className="text-lg font-semibold" style={{ color: '#1e2d3d' }}>
        {title}
      </h1>

      <div className="flex items-center gap-3">
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
            className="pl-9 pr-4 py-2 text-sm rounded-lg outline-none w-52"
            style={{
              backgroundColor: '#f8f8f6',
              border: '1px solid #e5e5e3',
              color: '#1e2d3d',
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
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
          style={{ backgroundColor: '#e8842c' }}
          title={profile?.name || profile?.email || ''}
        >
          {getInitials(profile?.name || profile?.email || '')}
        </div>
      </div>
    </header>
  )
}
