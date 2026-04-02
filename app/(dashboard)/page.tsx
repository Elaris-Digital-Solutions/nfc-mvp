'use client'

import { useState } from 'react'
import { Palette, User, Heart, Share2, LogOut, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/shared/sidebar'

const TEMPLATES = [
  {
    id: 'minimal-black',
    name: 'Minimal Black',
    category: 'CORPORATIVO',
    description: 'Sobria, nítida y de alto contraste.',
    bgColor: 'bg-black',
    textColor: 'text-white',
    borderColor: 'border-gray-800',
  },
  {
    id: 'glass-dark',
    name: 'Glass Dark',
    category: 'MODERNO',
    description: 'Profundidad translúcida con brillo suave.',
    bgColor: 'bg-gray-900',
    textColor: 'text-white',
    borderColor: 'border-blue-500',
  },
  {
    id: 'mono-sharp',
    name: 'Mono Sharp',
    category: 'IMPACTO',
    description: 'Editorial fuerte y geometría limpia.',
    bgColor: 'bg-gray-950',
    textColor: 'text-white',
    borderColor: 'border-white',
    isSelected: true,
  },
  {
    id: 'soft-light',
    name: 'Soft Light',
    category: 'LIFESTYLE',
    description: 'Luminoso, cercano y elegante.',
    bgColor: 'bg-gray-100',
    textColor: 'text-black',
    borderColor: 'border-gray-300',
  },
]

function PlantillasSection() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
            Direccion Visual
          </span>
        </div>
        <div className="flex items-start justify-between">
          <h1 className="text-5xl font-black tracking-tighter">PLANTILLAS</h1>
          <div className="text-right border border-border/20 rounded-lg px-4 py-2">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Plantilla Activa</p>
            <p className="text-sm font-semibold">Mono Sharp</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl">
          Elige una identidad visual para tu tarjeta. Cada plantilla cambia ritmo, contraste y
          personalidad de tu perfil público.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className={`rounded-xl border-2 p-6 space-y-4 ${
              template.isSelected
                ? 'border-white bg-gray-900/50'
                : 'border-gray-800 hover:border-gray-700'
            }`}
          >
            {/* Preview Card */}
            <div className={`${template.bgColor} rounded-lg p-4 space-y-3`}>
              <div className="w-12 h-12 rounded-full bg-gray-500"></div>
              <div className="space-y-1">
                <p className={`font-semibold text-sm ${template.textColor}`}>Fabrizio Bussalleu</p>
                <p className={`text-xs ${template.textColor} opacity-70`}>Consultor Comercial</p>
              </div>
              <div className="space-y-2 pt-2">
                <button className={`w-full py-2 px-3 rounded ${template.bgColor === 'bg-black' ? 'bg-gray-700' : template.bgColor === 'bg-gray-100' ? 'bg-gray-300' : 'bg-gray-800'} text-xs font-medium`}>
                  LinkedIn
                </button>
                <button className={`w-full py-2 px-3 rounded ${template.bgColor === 'bg-black' ? 'bg-gray-700' : template.bgColor === 'bg-gray-100' ? 'bg-gray-300' : 'bg-gray-800'} text-xs font-medium`}>
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  {template.category}
                </p>
                <h3 className="text-lg font-bold">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
              <Button
                variant={template.isSelected ? 'default' : 'outline'}
                size="sm"
                className="w-full"
              >
                {template.isSelected ? 'SELECCIONADA' : 'APLICAR'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiPerfilSection() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
            Tu Perfil
          </span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter">MI PERFIL</h1>
        <p className="text-lg text-muted-foreground mt-4">
          Personaliza la información que aparece en tu tarjeta pública.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-8 max-w-2xl">
        <div className="space-y-3">
          <label className="text-sm font-medium">Nombre Completo</label>
          <input
            type="text"
            defaultValue="Fabrizio Bussalleu"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white"
          />
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium">Cargo</label>
          <input
            type="text"
            defaultValue="Gerente"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white"
          />
        </div>
        <div className="space-y-3 col-span-2">
          <label className="text-sm font-medium">Empresa</label>
          <input
            type="text"
            defaultValue="ELARIS S.A.C.S"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white"
          />
        </div>
        <div className="space-y-3 col-span-2">
          <label className="text-sm font-medium">Descripción</label>
          <textarea
            defaultValue="Arquitectura de Producto e Integración de Sistemas | Full Stack Developer | Cofundador en Elaris Digital Solutions"
            rows={4}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white"
          />
        </div>
        <Button className="col-span-2">Guardar Cambios</Button>
      </div>
    </div>
  )
}

function MisTarjetasSection() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
            Tu Tarjeta Digital
          </span>
        </div>
        <h1 className="text-5xl font-black tracking-tighter">MI TARJETA</h1>
      </div>

      {/* Card Preview */}
      <div className="max-w-md mx-auto">
        <div className="relative rounded-2xl overflow-hidden bg-black pt-20 pb-8 px-6 space-y-6">
          {/* Background effect */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-transparent"></div>
          </div>

          <div className="relative z-10 space-y-6 text-center">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-400 to-gray-600"></div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">FABRIZIO BUSSALLEU</h2>
              <p className="text-lg text-gray-400">Gerente</p>
              <p className="text-sm text-gray-500">ELARIS S.A.C.S</p>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 leading-relaxed">
              Arquitectura de Producto e Integración de Sistemas | Full Stack Developer | Cofundador en Elaris Digital Solutions
            </p>

            {/* Action Button */}
            <Button className="w-full bg-white text-black hover:bg-gray-100">
              ↓ SINCRONIZAR CONTACTO
            </Button>

            {/* Social Links */}
            <div className="space-y-3 pt-4">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-900/50 transition">
                <span className="text-lg">📷</span>
                <span className="text-sm">Sígueme en Instagram</span>
                <span className="ml-auto text-gray-600">↗</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-900/50 transition">
                <span className="text-lg">💼</span>
                <span className="text-sm">Conectemos en LinkedIn</span>
                <span className="ml-auto text-gray-600">↗</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-800 hover:border-gray-700 hover:bg-gray-900/50 transition">
                <span className="text-lg">🔗</span>
                <span className="text-sm">Elaris Digital Solutions</span>
                <span className="ml-auto text-gray-600">↗</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState('plantilla')

  return (
    <div className="flex h-screen">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 overflow-auto bg-background p-8">
        <div className="max-w-7xl mx-auto">
          {activeSection === 'inicio' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
                  Panel Principal
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter">BIENVENIDO</h1>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="rounded-lg border border-gray-800 p-6 space-y-2">
                <p className="text-sm text-muted-foreground">Plantillas</p>
                <p className="text-3xl font-bold">4</p>
              </div>
              <div className="rounded-lg border border-gray-800 p-6 space-y-2">
                <p className="text-sm text-muted-foreground">Tu Tarjeta</p>
                <p className="text-3xl font-bold">Activa</p>
              </div>
              <div className="rounded-lg border border-gray-800 p-6 space-y-2">
                <p className="text-sm text-muted-foreground">Enlaces</p>
                <p className="text-3xl font-bold">3</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'plantilla' && <PlantillasSection />}
        {activeSection === 'perfil' && <MiPerfilSection />}
        {activeSection === 'tarjeta' && <MisTarjetasSection />}
        </div>
      </main>
    </div>
  )
}
