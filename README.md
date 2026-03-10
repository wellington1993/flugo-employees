# Flugo Staff Manager

Gerenciador de colaboradores feito com React + Firebase. Formulário multi-etapa com rascunho automático e sincronização com o Firestore.

Demo: [https://flugo-employees-theta.vercel.app](https://flugo-employees-theta.vercel.app)

---

## Stack

- React 19 + TypeScript + Vite
- Material UI v7 + Emotion
- TanStack Query v5
- React Hook Form + Zod
- Firebase Firestore
- React Router v7

---

## Como rodar

**Localmente**

```bash
npm install
# configure o .env com base no .env.example
npm run dev
# http://localhost:5173
```

**Com Docker**

```bash
docker compose up --build
# http://localhost:3000
```

---

## Testes

```bash
npm run test        # unitários (Vitest)
npm run test:e2e    # E2E (Playwright)
```

---

## Firebase

1. Crie um projeto no Firebase Console
2. Ative o Firestore em modo de teste
3. Copie as chaves web para o `.env`

As regras de segurança estão em `firestore.rules`. Para publicar:

```bash
npx firebase-tools deploy --only firestore:rules --project SEU_ID
```
