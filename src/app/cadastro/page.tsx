'use client'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth'
import { Button, Input } from '@/components/ui'
import { cadastroSchema, type CadastroFormData } from '@/schemas'
import styles from './cadastro-content.module.css'
import { api } from '@/lib/api/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { PublicOnlyGuard } from '@/components/auth/AuthGuard'
import { Suspense } from 'react'

function CadastroContent() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CadastroFormData>({
    resolver: yupResolver(cadastroSchema),
    mode: 'onChange' // Permite validação em tempo real
  });

  const onSubmit = async (data: CadastroFormData) => {
    try {
      await api.register({ nome: data.nome, email: data.email, senha: data.senha });
      const cb = params.get('callback') || '/';
      router.push(cb);
    } catch (error) {
      console.error('Erro no cadastro:', error);
    }
  };

  return (
    <PublicOnlyGuard>
    <AuthLayout>
      {/* Header */}
      <div className={styles.cadastroHeader}>
        <p className={styles.loginLink}>Já tem uma conta? <Link href="/login">Acessar conta</Link></p>
        <h1 className={styles.title}>Criar conta</h1>
      </div>

      {/* Form content */}
      <form className={styles.contentForm} onSubmit={handleSubmit(onSubmit)}>
        {/* Forms */}
        <div className={styles.forms}>
          <Input
            label="Nome"
            type="text"
            placeholder="Como você se chama?"
            {...register("nome")}
            error={errors.nome?.message}
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="Seu e-mail aqui"
            {...register("email")}
            error={errors.email?.message}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="Escolha uma senha segura"
            {...register("senha")}
            error={errors.senha?.message}
          />

          <Input
            label="Repetir a senha"
            type="password"
            placeholder="Repita sua senha para confirmar"
            {...register("repetirSenha")}
            error={errors.repetirSenha?.message}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>
  </AuthLayout>
  </PublicOnlyGuard>
  )
}

export default function CadastroPage() {
  return (
    <Suspense fallback={null}>
      <CadastroContent />
    </Suspense>
  )
}
