# 📱 Gerenciador de Contatos

Sistema para gerenciar contatos.

## 🌐 Acesso Online
**👉 [http://frontend-gerenciador-de-contatos.vercel.app/](http://frontend-gerenciador-de-contatos.vercel.app/)**

## ✨ Funcionalidades

### 🔒 **Autenticação Completa**
- Login e cadastro com validação robusta
- Proteção de rotas com JWT + Refresh Token
- Logout seguro

### 👥 **Gestão de Contatos**  
- ✅ Adicionar, editar e excluir contatos
- ✅ Upload de fotos com compressão automática
- ✅ Campos: Nome, Categoria, Telefone, Email
- ✅ Validação em tempo real

### 🔍 **Navegação Inteligente**
- ✅ Busca em tempo real por nome
- ✅ Filtro alfabético A-Z
- ✅ Paginação dinâmica
- ✅ Botão "Ver Todos"

### 🔒 **Criptografia Visual**
- ✅ Mascarar dados sensíveis individualmente
- ✅ Criptografia em lote (todos os contatos)
- ✅ Proteção por senha para descriptografar

### 📱 **Interface Responsiva**
- ✅ Design mobile-first
- ✅ Tema escuro elegante
- ✅ Tooltips informativos
- ✅ Feedback visual de todas as ações

## 🚀 Instalação Local

### **Pré-requisitos**
- Node.js 18+ instalado
- npm, yarn, pnpm ou bun

### **1. Clone o Repositório**
```bash
git clone https://github.com/israelhub/frontend-gerenciador-de-contatos.git
cd frontend-gerenciador-de-contatos
```

### **2. Instale as Dependências**
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### **3. Execute o Projeto**
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

### **4. Acesse no Navegador**
Abra [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuração da API

O sistema possui **detecção automática de backend**:

- **🏠 Desenvolvimento**: Tenta `http://localhost:8000/api` primeiro
- **☁️ Produção**: Fallback para `https://backend-gerenciador-de-contatos.onrender.com/api`
- **💾 Cache**: Evita múltiplas detecções na mesma sessão

### **Configuração Manual (Opcional)**
Crie um arquivo `.env.local` para forçar uma URL específica:

```bash
# Para backend local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Para produção  
NEXT_PUBLIC_API_BASE_URL=https://backend-gerenciador-de-contatos.onrender.com/api
```

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 + React + TypeScript
- **Formulários**: React Hook Form + Yup
- **Estilo**: CSS Modules
- **HTTP**: Cliente customizado com interceptadores
- **Deploy**: Vercel

## 📚 Documentação

Para mais detalhes técnicos, consulte a [documentação completa](./docs/README.md).

---