# Sistema de Criptografia Visual

## Conceito
Sistema de "criptografia" frontend que mascara informações sensíveis dos contatos com asteriscos (`********`).

## Funcionalidades

### **Criptografia Individual**
- Botão cadeado em cada linha
- Mascara apenas telefone/email do contato específico
- Mantém nome visível para identificação

### **Criptografia Global**  
- Botão cadeado na navbar
- Lógica: todos criptografados → descriptografar todos, senão → criptografar todos
- Operação em lote

## Implementação
- **Estado**: Set de IDs criptografados
- **Validação**: Senha via API para descriptografar
- **Visual**: Máscara `••••••••` nos campos sensíveis
- **Persistência**: Estado mantido durante sessão

## Limitações
- **Frontend-only**: Dados continuam na memória
- **Propósito**: UX/demo, não segurança real
- **Escopo**: Apenas telefone e email
