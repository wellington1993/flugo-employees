# Flugo Employees

Aplicação de cadastro e listagem de colaboradores desenvolvida como parte do desafio técnico da Flugo.

O formulário de cadastro é dividido em duas etapas — informações básicas e informações profissionais — com validação por etapa e barra de progresso. Os dados são persistidos no Firebase Firestore. Quando o Firebase não está disponível, os dados são salvos localmente no navegador e sincronizados automaticamente assim que a conexão for restabelecida.

## Acesso

| Ambiente | URL |
|---|---|
| Vercel (produção) | [https://flugo-employees-theta.vercel.app](https://flugo-employees-theta.vercel.app) |
| GitHub Pages | [https://wellington1993.github.io/flugo-employees/](https://wellington1993.github.io/flugo-employees/) |

**Importante:** Na Vercel, certifique-se de configurar as mesmas Variáveis de Ambiente (`VITE_FIREBASE_*`) utilizadas no GitHub Secrets.

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

### Regras do Firestore

O arquivo `firestore.rules` na raiz do projeto define as regras de segurança. Para fazer o deploy das regras:

```
npx firebase-tools deploy --only firestore:rules --project SEU_PROJECT_ID
```

## Como rodar com Docker

Certifique-se de ter o [Docker](https://docs.docker.com/get-docker/) instalado.

### Com docker-compose (recomendado)

1. Crie o arquivo `.env` com as credenciais do Firebase (igual ao passo acima).

2. Suba o container:

```
docker compose up --build
```

A aplicação estará disponível em `http://localhost:3000`.

### Build manual

```
docker build \
  --build-arg VITE_FIREBASE_API_KEY=sua_api_key \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain \
  --build-arg VITE_FIREBASE_PROJECT_ID=seu_project_id \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id \
  --build-arg VITE_FIREBASE_APP_ID=seu_app_id \
  -t flugo-employees .

docker run -p 3000:80 flugo-employees
```

## Deploy no GitHub Pages

O deploy no GitHub Pages é feito automaticamente via GitHub Actions a cada push na branch `main`.

Para que o workflow funcione, é necessário configurar os seguintes secrets no repositório:

**GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` | chave da API do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | auth domain do projeto |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | sender ID |
| `VITE_FIREBASE_APP_ID` | app ID |

Após o primeiro deploy via Actions, habilitar o GitHub Pages:

**GitHub → Settings → Pages → Source → Deploy from a branch → Branch: `gh-pages` → / (root)**


## Scripts disponíveis

```
npm run dev      # inicia o servidor de desenvolvimento
npm run build    # gera o build de produção
npm run preview  # pré-visualiza o build localmente
npm run lint     # verifica o código com ESLint
```

## Tecnologias

- React 19 + TypeScript
- Vite
- Material UI v7
- React Hook Form + Zod
- TanStack Query
- Firebase Firestore
- React Router v7
