'use client'

import { useEffect, useState } from 'react'
import { api, tokens } from '@/lib/api/client'
import type { User } from '@/lib/api/types'

let cachedUser: User | null = null
let inflight: Promise<User> | null = null

export function useMe() {
  const [user, setUser] = useState<User | null>(cachedUser)
  const [loading, setLoading] = useState<boolean>(!cachedUser)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    
    // Verifica se há tokens antes de fazer a chamada
    const { accessToken, refreshToken } = tokens.getTokens()
    if (!accessToken && !refreshToken) {
      setLoading(false)
      setError('No authentication tokens found')
      setUser(null)
      cachedUser = null // Limpa o cache se não há tokens
      return
    }
    
    if (cachedUser) {
      setLoading(false)
      return
    }
    
    const run = async () => {
      try {
        setError(null) // Limpa erros anteriores
        const p = inflight ?? api.me()
        inflight = p
        const me = await p
        if (!cancelled) {
          cachedUser = me
          setUser(me)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          const errorMessage = e instanceof Error ? e.message : String(e)
          setError(errorMessage)
          // Se for erro de autenticação, limpa o cache
          if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
            cachedUser = null
            setUser(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
        inflight = null
      }
    }
    
    run()
    return () => { cancelled = true }
  }, [])

  return { user, loading, error }
}

// Função para limpar o cache do usuário (útil no logout)
export function clearUserCache() {
  cachedUser = null
  inflight = null
}

// Função para atualizar o cache do usuário (útil após login)
export function updateUserCache(user: User) {
  cachedUser = user
}
