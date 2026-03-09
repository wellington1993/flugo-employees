# Flugo Employees

Aplicação de cadastro e listagem de colaboradores desenvolvida como parte do desafio técnico da Flugo.

O formulário de cadastro é dividido em duas etapas — informações básicas e informações profissionais — com validação por etapa e barra de progresso. Os dados são persistidos no Firebase Firestore.

## Acesso

O deploy está disponível em: https://flugo-employees-theta.vercel.app

## Pré-requisitos

- Node.js 22 ou superior
- npm

## Como rodar localmente

1. Clone o repositório:

```
git clone https://github.com/wellington1993/flugo-employees.git
cd flugo-employees
```

2. Instale as dependências:

```
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com as credenciais do Firebase (veja a seção abaixo).

4. Inicie o servidor de desenvolvimento:

```
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

## Configuração do Firebase

1. Acesse o [console do Firebase](https://console.firebase.google.com) e crie um novo projeto.

2. No menu lateral, vá em **Firestore Database** e clique em **Criar banco de dados**. Durante o desenvolvimento, selecione **modo de teste** para liberar leitura e escrita sem autenticação.

3. Ainda no console, vá em **Configurações do projeto** (ícone de engrenagem) e em **Seus apps**, clique em **Adicionar app** e escolha a opção Web.

4. Copie as credenciais geradas e crie o arquivo `.env` na raiz do projeto:

```
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

Há um arquivo `.env.example` na raiz como referência.

### Regras do Firestore (modo desenvolvimento)

No console do Firebase, em **Firestore Database > Regras**, substitua o conteúdo por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Essas regras permitem acesso total sem autenticação. Para produção, configure regras mais restritivas.

## Scripts disponíveis

```
npm run dev      # inicia o servidor de desenvolvimento
npm run build    # gera o build de produção
npm run preview  # pré-visualiza o build localmente
```

## Tecnologias

- React 18 + TypeScript
- Vite
- Material UI v7
- React Hook Form + Zod
- TanStack Query
- Firebase Firestore
- React Router v7
