'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await login(email, password)
    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-6 rounded-xl border border-border/40 bg-background/90 p-5 sm:p-7">
        <div className="space-y-2 text-center">
          <p className="text-xs tracking-[0.16em] uppercase text-muted-foreground">VELTRIX</p>
          <h1 className="text-2xl font-semibold tracking-normal">INICIAR SESION</h1>
          <p className="text-muted-foreground">Accede a tu cuenta</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="h-11 rounded-lg border-border/50 bg-background px-4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-11 rounded-lg border-border/50 bg-background px-4"
            />
          </div>

          <Button type="submit" className="w-full h-11 rounded-lg font-semibold uppercase tracking-wide" disabled={isLoading}>
            {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="space-y-3 text-center text-sm border-t border-border/30 pt-4">
          <p>
            ¿No tienes cuenta?{' '}
            <Link href="/signup" className="font-semibold hover:underline text-foreground">
              Crear cuenta
            </Link>
          </p>
          <p>
            <Link href="/" className="text-muted-foreground hover:text-foreground hover:underline">
              Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
