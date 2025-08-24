# Integração com API

## Cliente HTTP Customizado

### **Motivação**
- Controle total sobre tokens e refresh
- Interceptação automática de requests
- Tratamento centralizado de erros

### **Implementação**
```typescript
// Auto-inject Bearer token
headers.Authorization = `Bearer ${token}`

// Auto-refresh em 401
if (status === 401) {
  newToken = await refreshToken()
  // Retry original request
}
```

## Endpoints Principais

### **Autenticação**
- `POST /auth/login` → tokens
- `POST /auth/register` → criação usuário  
- `POST /auth/refresh` → novo access token
- `GET /auth/me` → dados do usuário

### **Contatos**
- `GET /contacts` → lista paginada
- `POST /contacts` → criar contato
- `PUT /contacts/:id` → atualizar contato  
- `DELETE /contacts/:id` → remover contato

## Tratamento de Erros

### **401 Unauthorized**
- Tentativa de refresh automático
- Logout forçado se refresh falhar
- Redirecionamento para login

### **Outros Erros**
- Toast notifications para feedback
- Validação duplicada frontend/backend
- Fallbacks graceful
