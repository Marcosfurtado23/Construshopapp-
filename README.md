# Construshop - SaaS App

Uma aplicação SaaS moderna para lojas de construção, construída com React, Node.js, e Firebase.

## 🚀 Arquitetura

O projeto segue uma arquitetura Fullstack moderna, com separação clara de responsabilidades:

- **Frontend:** React + Vite + TypeScript. Responsável pela UI/UX, autenticação (Firebase Auth) e consumo da API REST.
- **Backend:** Node.js + Express + TypeScript. Atua como intermediário seguro para operações críticas, validação de dados e integração com Firebase Admin SDK.
- **Banco de Dados:** Firestore. Estruturado para multi-tenancy (SaaS), garantindo isolamento de dados por usuário.

### Estrutura de Diretórios

```
├── server/                 # Código do Backend (Node.js/Express)
│   ├── controllers/        # Lógica de negócio e manipulação de requisições
│   ├── middlewares/        # Middlewares (Autenticação, Tratamento de Erros)
│   ├── routes/             # Definição de rotas da API REST
│   ├── services/           # Serviços externos (Firebase Admin)
│   ├── utils/              # Utilitários (Logger, etc.)
│   └── validators/         # Validação de dados com Zod
├── src/                    # Código do Frontend (React)
│   ├── components/         # Componentes React reutilizáveis
│   ├── services/           # Serviços de API e integração externa
│   ├── types/              # Definições de tipos TypeScript
│   ├── utils/              # Utilitários do frontend
│   ├── App.tsx             # Componente principal
│   └── firebase.ts         # Configuração do Firebase Client
├── firestore.rules         # Regras de segurança rigorosas do Firestore
└── server.ts               # Ponto de entrada do servidor Backend
```

## 🔐 Segurança

A segurança foi uma prioridade máxima nesta refatoração:

1. **Backend como Intermediário:** Operações críticas (como gerenciamento de produtos) passam obrigatoriamente pelo backend, protegendo a lógica de negócio e evitando manipulação direta do banco de dados pelo cliente.
2. **Validação de Dados:** Todas as entradas da API são validadas rigorosamente usando **Zod** no backend.
3. **Autenticação JWT:** O backend verifica tokens JWT gerados pelo Firebase Auth para garantir que apenas usuários autenticados acessem rotas protegidas.
4. **Regras do Firestore (Security Rules):** As regras foram reescritas para eliminar o acesso público. O acesso aos dados é restrito com base na propriedade do documento (`isOwner`) e em papéis de usuário (`isAdmin`, `isSupport`).
5. **Variáveis de Ambiente:** Configurações sensíveis e chaves de API foram movidas para variáveis de ambiente (`.env`), removendo-as do código-fonte.

## 🏢 Escalabilidade (SaaS Multi-tenant)

O sistema foi preparado para operar como um SaaS (Software as a Service):

- **Isolamento de Dados:** A estrutura do banco de dados foi alterada para `users/{userId}/products/{productId}`. Isso garante que cada lojista (tenant) tenha seus produtos isolados de outros lojistas.
- **Marketplace vs. Loja Específica:** A API permite buscar produtos de todos os lojistas (visão de marketplace) ou de um lojista específico (`?tenantId=...`).

## 🛠️ Como Executar o Projeto

### Pré-requisitos

- Node.js (v18+)
- Conta no Firebase com Firestore e Authentication (Google Provider) configurados.

### Configuração de Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
2. Preencha as variáveis no arquivo `.env` com as credenciais do seu projeto Firebase.
   - Para o frontend, preencha as variáveis `VITE_FIREBASE_*`.
   - Para o backend, você precisará da chave da conta de serviço (`FIREBASE_SERVICE_ACCOUNT_KEY`) em formato JSON (stringificada) ou configurar o ambiente do Google Cloud.

### Instalação e Execução

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento (Frontend + Backend simultaneamente):
   ```bash
   npm run dev
   ```
3. Acesse a aplicação no navegador (geralmente em `http://localhost:3000`).

## 📝 Próximas Etapas e Melhorias Futuras

- **Testes Automatizados:** Implementar testes unitários (Jest/Vitest) para o backend e testes E2E (Cypress/Playwright) para o frontend.
- **Pagamentos:** Integrar um gateway de pagamento (Stripe, Mercado Pago) no backend.
- **Refatoração do Frontend:** Dividir o componente `App.tsx` em páginas menores (`src/pages`) usando um roteador (React Router).
- **Gerenciamento de Estado:** Adicionar uma biblioteca de gerenciamento de estado global (Zustand, Redux) para o carrinho de compras e dados do usuário.
