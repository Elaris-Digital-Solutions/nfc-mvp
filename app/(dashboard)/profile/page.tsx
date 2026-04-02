'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { User } from 'lucide-react'

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    title: user?.title || '',
    company: user?.company || '',
    bio: user?.bio || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    updateProfile(formData)
    // Could show a toast here
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
              Mi Perfil
            </span>
          </div>
          <h1 className="text-4xl font-bold">Personaliza tu Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Actualiza tu información personal que aparecerá en tu tarjeta pública
          </p>
        </div>

        {/* Profile Preview */}
        <div className="rounded-lg bg-card/50 p-8 flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{formData.name}</h2>
            <p className="text-muted-foreground">{formData.title || 'Profesión'}</p>
            <p className="text-sm text-muted-foreground">{formData.company}</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Cargo / Profesión</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Tu cargo o profesión"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Tu empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Cuéntanos sobre ti..."
              className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <Button onClick={handleSave} size="lg" className="w-full">
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
