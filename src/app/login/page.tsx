'use client'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth'
import { Button, Input } from '@/components/ui'
import { loginSchema, type LoginFormData } from '@/schemas'
import styles from './login-content.module.css'
import { api } from '@/lib/api/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, Suspense } from 'react'
import { MdCancel } from 'react-icons/md'
import { PublicOnlyGuard } from '@/components/auth/AuthGuard'

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const [apiError, setApiError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError(null);
      await api.login({ email: data.email, senha: data.senha });
      const cb = params.get('callback') || '/';
      router.push(cb);
    } catch (error) {
      // Extrair mensagem do erro lançado pelo client (pode ter .details)
      let msg = 'Erro ao autenticar';
      if (error instanceof Error) msg = error.message;
      const maybe = error as { details?: unknown };
      if (maybe?.details && typeof maybe.details === 'object') {
        const d = maybe.details as Record<string, unknown>;
        const m = d['message'];
        if (m) msg = Array.isArray(m) ? m.join(', ') : String(m);
      }
      setApiError(msg);
      console.error('Erro no login:', error);
    }
  };

  // Corrige Enter: garante submissão chamando handleSubmit(onSubmit) ao pressionar Enter dentro do form
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      // Permite que o browser submeta normalmente quando o foco está em inputs; RHF já intercepta onSubmit
      // Evita submissão dupla não chamando preventDefault aqui.
    }
  }, []);

  // Registra inputs e compõe eventos para não sobrescrever RHF
  const emailReg = register('email');
  const senhaReg = register('senha');

  return (
    <PublicOnlyGuard>
    <AuthLayout containerClassName={styles.mainContainer}>
      {/* Header */}
      <div className={styles.loginHeader}>
        <p className={styles.signupLink}>Não tem uma conta? <Link href="/cadastro">Criar conta</Link></p>
        <h1 className={styles.title}>Acessar conta</h1>
      </div>

      {/* Form content */}
      <form 
        className={styles.contentForm} 
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.forms}>
          <Input
            label="E-mail"
            type="email"
            placeholder="Digite seu e-mail"
            {...emailReg}
            error={errors.email?.message}
            required
            onChange={(e) => { emailReg.onChange(e); if (apiError) setApiError(null); }}
            onBlur={(e) => { emailReg.onBlur(e); if (apiError) setApiError(null); }}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="Digite sua senha"
            {...senhaReg}
            error={errors.senha?.message}
            required
            onChange={(e) => { senhaReg.onChange(e); if (apiError) setApiError(null); }}
            onBlur={(e) => { senhaReg.onBlur(e); if (apiError) setApiError(null); }}
          />
        </div>

        <div className={styles.buttonRow}>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Acessar Conta'}
          </Button>
        </div>

        {apiError && (
          <div className={styles.authErrorBanner} role="alert">
            <MdCancel size={18} color="#E61E32" />
            <span>{apiError}</span>
          </div>
        )}
      </form>
  </AuthLayout>
  </PublicOnlyGuard>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}