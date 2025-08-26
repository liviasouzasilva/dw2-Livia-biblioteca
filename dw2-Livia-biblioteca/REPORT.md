# Relatório Técnico - Biblioteca Escolar

## Visão Geral

Este relatório documenta o desenvolvimento do sistema de biblioteca escolar, incluindo decisões técnicas, desafios encontrados e soluções implementadas.

## Decisões Técnicas

### Frontend

#### HTML5
- Uso de elementos semânticos para melhor acessibilidade
- Dialog nativo para modals
- Forms com validação nativa

#### CSS3
- Grid Layout para estrutura principal
- Flexbox para alinhamentos
- Variáveis CSS para tema consistente
- Media queries para responsividade

#### JavaScript
- ES6+ features (async/await, arrow functions, etc.)
- Modules para organização do código
- localStorage para persistência de preferências
- Scroll infinito para performance

### Backend

#### FastAPI
- Framework moderno e performático
- Documentação automática (OpenAPI/Swagger)
- Validação automática com Pydantic
- CORS middleware configurado

#### SQLAlchemy
- ORM para abstração do banco de dados
- Modelos declarativos
- Migrations simplificadas

#### SQLite
- Banco de dados leve e portátil
- Adequado para escala do projeto
- Fácil backup e manutenção

## Acessibilidade

### Implementações
- ARIA labels em todos elementos interativos
- Navegação por teclado otimizada
- Contraste adequado (testado com WCAG 2.1)
- Feedback visual claro
- Mensagens de erro descritivas

### Testes Realizados
- Navegação completa por teclado
- Verificação de contraste
- Teste com leitores de tela
- Validação WCAG 2.1

## Desafios e Soluções

### Desafio 1: Performance com Muitos Livros
**Solução:** Implementação de scroll infinito e paginação no backend

### Desafio 2: Estado do Empréstimo
**Solução:** Sistema de timestamps UTC e validações de estado

### Desafio 3: Duplicação de Títulos
**Solução:** Validação frontend e constraint unique no banco

## Melhorias Futuras

1. Autenticação de usuários
2. Sistema de reservas
3. Notificações de atraso
4. Relatórios avançados
5. PWA para acesso offline

## Conclusão

O projeto atende todos os requisitos propostos, com foco em usabilidade, acessibilidade e manutenibilidade. A arquitetura escolhida permite fácil expansão e adaptação futura.
