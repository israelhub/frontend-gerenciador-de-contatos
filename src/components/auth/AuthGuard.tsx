'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api, tokens } from '@/lib/api/client'

type AuthGuardProps = { children: ReactNode }

/**
 * Protege rotas privadas baseadas na presença/validade do token.
 * - Se não houver token, redireciona para /login com callback=pathname
 * - Opcionalmente valida com /users/me; se 401 mesmo após refresh, redireciona.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    const checkAuth = async () => {
      const { accessToken, refreshToken } = tokens.getTokens();
      if (!accessToken && !refreshToken) {
        if (!cancelled) {
          router.replace(`/login?callback=${encodeURIComponent(pathname || '/')}`);
        }
        return;
      }
      try {
        // pequena validação chama /users/me (dispara refresh automático em 401)
        await api.me();
        if (!cancelled) setAllowed(true);
      } catch {
        // invalidou mesmo após refresh
        if (!cancelled) {
          router.replace(`/login?callback=${encodeURIComponent(pathname || '/')}`);
        }
      }
    };
    
    checkAuth();
    
    // Escuta mudanças nos tokens
    const handleAuthChange = () => {
      setAllowed(false); // Reset o estado
      checkAuth();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('authTokensChanged', handleAuthChange);
    }
    
    return () => { 
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('authTokensChanged', handleAuthChange);
      }
    };
  }, [router, pathname]);

  if (!allowed) return null;
  return <>{children}</>;
}

/**
 * Guarda para páginas públicas: se já estiver logado, envia para home.
 */
export function PublicOnlyGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    let cancelled = false;
    
    const checkTokens = () => {
      const { accessToken, refreshToken } = tokens.getTokens();
      if (accessToken || refreshToken) {
        if (!cancelled) {
          router.replace('/home');
        }
      } else {
        if (!cancelled) {
          setReady(true);
        }
      }
    };
    
    // Verifica tokens imediatamente
    checkTokens();
    
    // Escuta mudanças nos tokens
    const handleAuthChange = () => {
      setReady(false); // Reset o estado
      checkTokens();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('authTokensChanged', handleAuthChange);
    }
    
    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('authTokensChanged', handleAuthChange);
      }
    };
  }, [router]);
  
  if (!ready) return null;
  return <>{children}</>;
}
