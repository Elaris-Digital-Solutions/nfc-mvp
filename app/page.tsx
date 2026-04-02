import Link from 'next/link'
import { Header } from '@/components/shared/header'
import { NFCBadge } from '@/components/shared/nfc-badge'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-8 text-center py-20">
          {/* NFC Badge */}
          <NFCBadge />

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white leading-tight">
              IDENTIDAD
            </h1>
            <p className="text-4xl md:text-5xl font-bold text-muted-foreground">
              DE ALTO IMPACTO
            </p>
          </div>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Frontend migrado a stack estilo Lovable. Vite + React + Tailwind + rutas simples para iterar UI rápido.
          </p>

          {/* CTA Button */}
          <Button asChild size="lg" className="mt-4">
            <Link href="/auth/signup">
              COMIENZA AHORA <span className="ml-2">→</span>
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
