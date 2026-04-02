'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface UserProfile {
  id: string
  name: string
  email: string
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Hydrate user from localStorage on mount - client-side only
  useEffect(() => {
    setMounted(true)
    try {
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        setUser(JSON.parse(currentUser))
      }
    } catch (error) {
      console.error('Failed to hydrate user:', error)
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check if user exists in localStorage (for MVP)
      const users = JSON.parse(localStorage.getItem('users') || '{}')
      const userData = users[email]
      
      if (!userData || userData.password !== password) {
        throw new Error('Invalid credentials')
      }

      setUser(userData.profile)
      localStorage.setItem('currentUser', JSON.stringify(userData.profile))
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      // Store user in localStorage (for MVP)
      const users = JSON.parse(localStorage.getItem('users') || '{}')
      
      if (users[email]) {
        throw new Error('Email already registered')
      }

      const newUser: UserProfile = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        selectedTemplate: 'mono-sharp',
        links: [
          { id: '1', title: 'LinkedIn', url: '', icon: 'linkedin' },
          { id: '2', title: 'WhatsApp', url: '', icon: 'whatsapp' },
        ],
      }

      users[email] = {
        profile: newUser,
        password, // Note: In production, this should be hashed
      }

      localStorage.setItem('users', JSON.stringify(users))
      localStorage.setItem('currentUser', JSON.stringify(newUser))
      setUser(newUser)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUser')
  }

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      
      // Update in localStorage
      const users = JSON.parse(localStorage.getItem('users') || '{}')
      if (users[user.email]) {
        users[user.email].profile = updatedUser
        localStorage.setItem('users', JSON.stringify(users))
      }
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
