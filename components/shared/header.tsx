'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="border-b border-border/10 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="h-16 px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="font-bold text-lg tracking-tight">
          Identidad
        </Link>

        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">INICIAR SESION</Link>
          </Button>
          <Button asChild variant="default" size="sm">
            <Link href="/signup">CREAR CUENTA</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
