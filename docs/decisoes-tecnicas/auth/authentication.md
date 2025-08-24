# Sistema de Autenticação

## Arquitetura
- **Tokens**: JWT + Refresh Token
- **Storage**: localStorage
- **Guards**: AuthGuard protege rotas principais

## Fluxo
```typescript
// 1. Login
POST /auth/login → { token, refreshToken }

// 2. Request autenticado  
GET /contacts
Headers: { Authorization: Bearer ${token} }

// 3. Token expirado (401)
POST /auth/refresh → { token: newToken }
// Retry automático da requisição original
```

## Componentes Principais

### **AuthGuard** (`src/components/auth/AuthGuard.tsx`)
- Verifica tokens no localStorage
- Valida com backend via `api.me()`
- Redireciona para `/login` se inválido
- Protege todas as rotas principais

### **AuthLayout** (`src/components/auth/AuthLayout.tsx`)  
- Layout compartilhado para login/cadastro
- Responsivo com breakpoints
- Logo, formulário e validação

## Cliente HTTP
- **Interceptador**: Adiciona Bearer token automaticamente
- **Refresh automático**: Em caso de 401
- **Retry**: Reprocessa requisição original
- **Fallback**: Logout forçado se refresh falhar

## Hooks

### **useMe** (`src/hooks/useMe.ts`)
- Cache do usuário autenticado
- Previne chamadas duplicatas  
- Usado na sidebar para mostrar email

## Estados de Loading
- **AuthGuard**: Mostra loading durante verificação
- **Forms**: Estados disabled durante submit
- **API**: Feedback visual de carregamento
