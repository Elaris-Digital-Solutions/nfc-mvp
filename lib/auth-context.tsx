'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  whatsapp?: string
  title?: string
  company?: string
  bio?: string
  profileImage?: string
  selectedTemplate?: 'minimal-black' | 'glass-dark' | 'mono-sharp' | 'soft-light'
  links?: {
    id: string
    title: string
    url: string
    icon: string
  }[]
}

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_USER: UserProfile = {
  id: 'usuario-principal',
  name: 'Usuario Principal',
  email: 'fabriziobussalleu@gmail.com',
  phone: '+51915247319',
  whatsapp: '+51 915247319',
  title: 'Gerente',
  company: 'ELARIS S.A.C.S',
  bio: 'Arquitectura de Producto e Integracion de Sistemas | Full Stack Developer | Cofundador en Elaris Digital Solutions',
  selectedTemplate: 'mono-sharp',
  links: [
    { id: '1', title: 'LinkedIn', url: '', icon: 'linkedin' },
    { id: '2', title: 'WhatsApp', url: '', icon: 'whatsapp' },
  ],
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER)
  const [isLoading, setIsLoading] = useState(false)

  // Hydrate user from localStorage on mount - fallback to default user
  useEffect(() => {
    try {
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        setUser(JSON.parse(currentUser))
      } else {
        localStorage.setItem('currentUser', JSON.stringify(DEFAULT_USER))
      }
    } catch (error) {
      console.error('Failed to hydrate user:', error)
      setUser(DEFAULT_USER)
    }
  }, [])

  const login = async (email: string, password: string) => {
    void password
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const loginUser: UserProfile = {
        ...DEFAULT_USER,
        email: email || DEFAULT_USER.email,
      }
      setUser(loginUser)
      localStorage.setItem('currentUser', JSON.stringify(loginUser))
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    void password
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const newUser: UserProfile = {
        ...DEFAULT_USER,
        id: Math.random().toString(36).slice(2, 11),
        name: name || DEFAULT_USER.name,
        email: email || DEFAULT_USER.email,
      }

      localStorage.setItem('currentUser', JSON.stringify(newUser))
      setUser(newUser)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(DEFAULT_USER)
    localStorage.setItem('currentUser', JSON.stringify(DEFAULT_USER))
  }

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
