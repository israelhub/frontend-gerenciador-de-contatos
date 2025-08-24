# Navegação e Filtros

## Filtro Alfabético A-Z

### **Problema Resolvido**
- Reset indesejado para letra "C" após operações
- Perda de posição do usuário

### **Solução**
- **Estado controlado**: Props trigger em vez de key remount
- **Preservação**: Mantém letra selecionada durante operações
- **Inicialização**: Sempre começa em "A"

### **Comportamento**
- **Durante busca**: Filtro fica inativo visualmente
- **Após limpar busca**: Retorna para letra ativa
- **Normalização**: Contatos acentuados (Ângela → A)

## Botão "Ver Todos"

### **Função**
- Remove filtros alfabéticos e de busca
- Exibe lista completa de contatos
- Estado visual claro (ativo/inativo)

### **UX**
- Aparece quando há filtros ativos
- Uma ação para limpar tudo
- Feedback visual imediato

## Estados de Navegação

### **Buscando**
- Input de busca ativo
- Filtro alfabético visualmente inativo
- Resultados em tempo real

### **Navegando por Letra**  
- Letra específica selecionada
- Input de busca limpo
- Paginação por letra

### **Ver Todos**
- Sem filtros ativos  
- Lista completa exibida
- Paginação normal
