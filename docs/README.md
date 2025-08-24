# 📱 Gerenciador de Contatos - Documentação

## 📚 Navegação
- **[Decisões Técnicas](./decisoes-tecnicas/README.md)** - Resumo geral das escolhas técnicas
- **[Autenticação](./decisoes-tecnicas/auth/authentication.md)** - Sistema de login e guards
- **[Integração API](./decisoes-tecnicas/integracoes/api.md)** - Cliente HTTP e endpoints
- **[Navegação](./decisoes-tecnicas/navegacao/navegacao.md)** - Filtros e busca
- **[Criptografia](./decisoes-tecnicas/criptografia/criptografia.md)** - Sistema de mascaramento

---

## 🏗️ Arquitetura
- **Frontend**: Next.js 14 + React + TypeScript
- **Formulários**: React Hook Form + Yup
- **Estilo**: CSS Modules  
- **API**: REST com autenticação JWT

## 🔐 Autenticação
- **Tokens**: JWT + Refresh Token
- **Guard**: AuthGuard protege rotas principais
- **Storage**: localStorage

## 📋 Formulários e Validação

### **Esquemas de Validação** (`src/schemas/index.ts`)

#### **Contatos**
```typescript
nome: obrigatório, max 255 chars
categoria: opcional, max 100 chars  
telefone: opcional, formato E.164 (+5511999999999)
email: opcional, formato válido, max 255 chars
foto: opcional, URL válida, max 500 chars
```

#### **Autenticação**
```typescript
// Login
email: obrigatório, formato válido
senha: obrigatória, min 6 chars

// Cadastro  
nome: obrigatório, 2-50 chars
email: obrigatório, formato válido
senha: obrigatória, min 8 chars + número/símbolo
repetirSenha: deve ser igual à senha
```

### **Validação em Tempo Real**
- **Modo**: `onChange` para feedback imediato
- **Erros**: Aparecem abaixo dos inputs com ícone
- **Layout**: Responsivo, altura dinâmica

## 🎨 Componentes Principais

### **Estrutura**
```
src/components/
├── auth/           # AuthGuard, AuthLayout
├── home/           # ContactList, Modais, Sidebar  
└── ui/             # Inputs, Buttons, base components
```

### **Modais**
- **AddContactModal**: Criar contato
- **EditContactModal**: Editar contato  
- **ChangePasswordModal**: Trocar senha
- **Layout responsivo**: Breakpoints 480px, 767px, 1024px

## 🔧 Funcionalidades

### **Gestão de Contatos**
- ✅ CRUD completo
- ✅ Upload de foto
- ✅ Filtros por letra (A-Z)
- ✅ Busca por nome
- ✅ Paginação

### **Navegação**
- ✅ Filtro alfabético otimizado
- ✅ Botão "Ver Todos"
- ✅ Estados de loading

### **UX/UI**
- ✅ Tooltips informativos
- ✅ Feedback visual de ações
- ✅ Responsividade completa
- ✅ Tema escuro consistente

## 🚀 Principais Decisões Técnicas

### **Formulários**
- **RHF + Yup**: Validação robusta e performática
- **Centralização**: Schemas reutilizáveis
- **UX**: Validação em tempo real nos modais

### **Layout**  
- **CSS Modules**: Escopo isolado
- **Responsivo**: Mobile-first
- **Consistência**: Paleta de cores unificada

### **Estado**
- **React State**: Hooks nativos  
- **Fetch Client**: HTTP customizado
- **Error Handling**: Toast notifications

### **Segurança**
- **Autenticação**: JWT com refresh automático
- **Proteção**: Guards em todas as rotas principais
- **Validação**: Frontend + Backend sincronizados
