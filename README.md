# Flugo Employees

Painel de colaboradores — desafio técnico Flugo.

**Deploy:** https://flugo-employees-theta.vercel.app

## Rodando localmente

```bash
git clone https://github.com/wellington1993/flugo-employees.git
cd flugo-employees
npm install
```

Crie um `.env` na raiz (tem um `.env.example` como base):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

```bash
npm run dev
# http://localhost:5173
```

## Firebase

Precisa de um projeto com Firestore no modo de teste. Para publicar as regras do `firestore.rules`:

```bash
npx firebase-tools deploy --only firestore:rules --project SEU_PROJECT_ID
```

## Docker

```bash
docker compose up --build
# http://localhost:3000
```

Build manual passando as variáveis como build args:

```bash
docker build \
  --build-arg VITE_FIREBASE_API_KEY=... \
  --build-arg VITE_FIREBASE_PROJECT_ID=... \
  -t flugo-employees .

docker run -p 3000:80 flugo-employees
```

## Stack

React 19 · TypeScript · Vite · MUI v7 · React Hook Form + Zod · TanStack Query · Firebase Firestore · React Router v7
