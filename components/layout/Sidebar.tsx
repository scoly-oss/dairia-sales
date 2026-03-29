'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  FileText,
  Bell,
  BookOpen,
  Mail,
  Settings,
  LogOut,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useSidebar } from './SidebarContext'
import { useEffect } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/prospects', label: 'Prospects', icon: Users },
  { href: '/propositions', label: 'Propositions', icon: FileText },
  { href: '/relances', label: 'Relances', icon: Bell },
  { href: '/catalogue', label: 'Catalogue', icon: BookOpen },
  { href: '/emails', label: 'Emails', icon: Mail },
  { href: '/veille', label: 'Veille', icon: Eye },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebar()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={close}
        />
      )}

      <aside
        className={[
          'w-60 flex flex-col h-full fixed left-0 top-0 z-40',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
        style={{
          backgroundColor: '#1e2d3d',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: '#e8842c' }}
          >
            D
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold text-sm">DAIRIA Sales</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              CRM Avocats
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={close}
            className="lg:hidden p-1 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
                style={{
                  backgroundColor: isActive ? '#e8842c' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                  }
                }}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div
          className="px-3 py-3 space-y-0.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Link
            href="/parametres"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              color: pathname === '/parametres' ? '#e8842c' : 'rgba(255,255,255,0.5)',
            }}
          >
            <Settings size={16} />
            <span>Paramètres</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
            }}
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  )
}
