'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { LogOut, Home, User, Link as LinkIcon, LayoutGrid, Orbit } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'perfil', label: 'Mi perfil', icon: User },
  { id: 'botones', label: 'Mis botones', icon: LinkIcon },
  { id: 'plantilla', label: 'Plantilla', icon: LayoutGrid },
]

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <aside className="w-72 border-r border-border bg-background/50 backdrop-blur-sm flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2">PANEL</p>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-2">{user?.email}</p>
      </div>

      <nav className="flex-1 overflow-auto p-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-foreground hover:bg-background'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Button
          asChild
          variant="outline"
          className="w-full justify-center"
        >
          <Link href="/tarjeta">
            <Orbit className="w-5 h-5 mr-2" />
            Mi tarjeta
          </Link>
        </Button>

        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar sesion
        </Button>
      </div>
    </aside>
  )
}
