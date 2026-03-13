# Flugo Employees

Este é o sistema de gestão de colaboradores e times da Flugo. Ele foi construído com foco em resiliência e facilidade de manutenção, usando uma arquitetura limpa que separa bem as regras de negócio da infraestrutura técnica.

Demo online: [https://flugo-employees-theta.vercel.app](https://flugo-employees-theta.vercel.app)

## O que tem dentro?

- **React 19 + TypeScript:** O core da aplicação com a última versão do React.
- **Material UI v7:** Toda a interface visual e componentes de UI.
- **Firebase (Auth + Firestore):** Controle de acesso e banco de dados em tempo real.
- **TanStack Query v5:** Gerenciamento inteligente de estado e cache de dados.
- **Clean Architecture:** Código organizado em camadas (Domínio, Aplicação, Infra e Apresentação).
- **Service Workers:** Estratégias avançadas de caching e sincronização de dados em segundo plano.

## Como rodar na sua máquina

Primeiro, clone o repositório e instale as dependências:

```bash
npm install
```

### Configurando o ambiente

Você vai precisar de um arquivo `.env.local` na raiz do projeto. Use o `.env.example` como base e preencha com as suas chaves do Firebase:

```env
VITE_FIREBASE_API_KEY=sua_chave
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### Rodando o projeto

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador.

### Build de Produção

Para gerar a versão final otimizada:

```bash
npm run build
npm run preview
```

## Docker (Jeito fácil)

Se você curte Docker, é só subir o container:

```bash
docker compose up --build
```

O app vai estar disponível em `http://localhost:3000`.

## Configurando o Firebase

Para que tudo funcione, você precisa ativar dois serviços no seu console do Firebase:

1. **Authentication:** Ative o provedor de **E-mail/Senha**.
2. **Cloud Firestore:** Crie o banco de dados.

### Regras de Segurança

Para aplicar as regras do banco de dados (que estão no arquivo `firestore.rules`), você pode usar o CLI do Firebase:

```bash
npx firebase-tools deploy --only firestore:rules --project SEU_ID_DO_PROJETO
```

## Testes

Temos uma boa cobertura de testes para garantir que nada quebre ao adicionar novas funções:

- **Unitários:** `npm run test` (testamos a lógica de negócio isolada).
- **E2E:** `npm run test:e2e` (testamos o fluxo completo no navegador com Playwright).
