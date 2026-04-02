'use client'

import { useAuth } from '@/lib/auth-context'
import { LinktreeCard } from '@/components/card/linktree-card'

export default function PublicProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Perfil no encontrado</h1>
          <p className="text-muted-foreground">El usuario que buscas no existe o el enlace es inválido.</p>
        </div>
      </div>
    )
  }

  return <LinktreeCard />
}
