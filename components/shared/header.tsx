'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'

export function Header() {
  const { user } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <header className="border-b border-border/10 sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="h-16 px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="font-bold text-lg tracking-tight">
          Identidad
        </Link>

        <div className="flex items-center gap-4">
          {isMounted && user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button asChild variant="default" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">INICIAR SESION</Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href="/auth/signup">CREAR CUENTA</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
